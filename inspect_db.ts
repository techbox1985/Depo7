import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ouoirydeqziftfnhansx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91b2lyeWRlcXppZnRmbmhhbnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTUyNDcsImV4cCI6MjA4ODQ5MTI0N30.X26OTNj0TFBSxAb15HpOa0pqhlNDE6uRnFYMNoEnntE'
);

async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('products:', data, error);
}
run();
