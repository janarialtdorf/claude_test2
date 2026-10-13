-- =====================================================================
-- Rate limiting for checkout ("fixed window" counters).
--
-- Time is cut into fixed blocks (e.g. 10 minutes). For each key — a hashed
-- visitor ID, or 'global' for the whole shop — we count attempts in the
-- current block. Once the count passes the limit, attempts are refused
-- until the next block starts.
--
-- Privacy: keys are HMAC hashes made by the Next.js server; raw IP
-- addresses are never stored. Rows older than one day are deleted.
--
-- Only the server (service_role / secret key) can use any of this.
-- =====================================================================

create table public.rate_limit_counters (
  key          text not null check (char_length(key) between 1 and 200),
  window_start timestamptz not null,
  count        integer not null default 0 check (count >= 0),
  primary key (key, window_start)
);

-- Makes the clean-up of old rows fast.
create index rate_limit_counters_window_start_idx on public.rate_limit_counters (window_start);

alter table public.rate_limit_counters enable row level security;
revoke all on table public.rate_limit_counters from anon, authenticated;
grant all on table public.rate_limit_counters to service_role;
-- No RLS policies: the public can't read or write this table at all.


-- Counts one attempt for p_key and says whether it's allowed.
-- Returns: {"allowed": true/false, "retry_after_seconds": N}
create function public.consume_rate_limit(
  p_key            text,
  p_limit          integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count        integer;
  v_allowed      boolean;
begin
  if p_key is null or char_length(p_key) not between 1 and 200
     or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit_args';
  end if;

  -- Start of the current block, e.g. 12:40:00 for a 10-minute window at 12:47.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  -- One atomic statement: create the counter at 1, or add 1 to it.
  -- Two simultaneous requests can't both read the old value.
  insert into public.rate_limit_counters as c (key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start) do update set count = c.count + 1
  returning c.count into v_count;

  -- Housekeeping: forget counters older than a day.
  delete from public.rate_limit_counters
  where window_start < now() - interval '1 day';

  v_allowed := v_count <= p_limit;

  return jsonb_build_object(
    'allowed', v_allowed,
    'retry_after_seconds',
    case
      when v_allowed then 0
      else greatest(1, ceil(extract(epoch from
             (v_window_start + make_interval(secs => p_window_seconds)) - now()))::integer)
    end
  );
end;
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
