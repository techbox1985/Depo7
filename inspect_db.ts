import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ouoirydeqziftfnhansx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91b2lyeWRlcXppZnRmbmhhbnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTUyNDcsImV4cCI6MjA4ODQ5MTI0N30.X26OTNj0TFBSxAb15HpOa0pqhlNDE6uRnFYMNoEnntE'
);

async function run() {
  const { data, error } = await supabase.rpc('get_functions', {});
  if (error) {
    // If get_functions doesn't exist, try a direct query if possible (though Supabase usually doesn't allow direct queries to system tables via anon key)
    console.log('get_functions failed, trying direct query');
    const { data: routines, error: routinesError } = await supabase.from('pg_proc').select('proname').limit(10);
    console.log('routines:', routines, routinesError);
  } else {
    console.log('functions:', data);
  }
}
run();
