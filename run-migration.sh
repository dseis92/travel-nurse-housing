#!/bin/bash

# Run the migration SQL directly
curl -X POST 'https://fhwyvxdhdklntaaztjoz.supabase.co/rest/v1/rpc/exec_sql' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3l2eGRoZGtsbnRhYXp0am96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjI4NjUsImV4cCI6MjA3OTczODg2NX0.-C0nD0CtTNobQP88t2XhY3fmxFHum343XZGKG9UwWwA" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod3l2eGRoZGtsbnRhYXp0am96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjI4NjUsImV4cCI6MjA3OTczODg2NX0.-C0nD0CtTNobQP88t2XhY3fmxFHum343XZGKG9UwWwA" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS monthly_rate INTEGER; UPDATE bookings b SET monthly_rate = l.price_per_month FROM listings l WHERE b.listing_id = l.id AND b.monthly_rate IS NULL;"
  }'
