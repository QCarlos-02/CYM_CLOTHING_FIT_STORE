import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zhbifkakuklgodydwora.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoYmlma2FrdWtsZ29keWR3b3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTc5MTUsImV4cCI6MjA3MDUzMzkxNX0.VHs3xr6P4mbkYxy0zcKsSBX-UdmCk_nkL1RAEHuqxRg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
