# Create a quick reference file
cat > ../DATABASE_INFO.md << EOF
# Database Connection Info

## Local Development
- **Studio URL**: http://localhost:54323
- **API URL**: http://localhost:54321
- **Database URL**: postgresql://postgres:postgres@localhost:54322/postgres

## Environment Variables Needed
Add these to your .env files:

\`\`\`bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=[get from supabase status output]
SUPABASE_SERVICE_ROLE_KEY=[get from supabase status output]
\`\`\`

## Commands
- **Start**: \`supabase start\`
- **Stop**: \`supabase stop\`
- **Reset**: \`supabase db reset\`
- **Status**: \`supabase status\`
- **Studio**: Open http://localhost:54323

## Tables Created
- \`user_profiles\` - User profile information
- \`projects\` - User projects
- \`chat_sessions\` - Chat conversations
- \`messages\` - Individual chat messages
- \`user_preferences\` - User settings and preferences
- \`learning_events\` - AI learning data
- \`project_files\` - Project file management
- \`vague_phrases\` - Training data for vague phrase interpretation

## Sample Data
The database includes sample vague phrases for AI training and default user preferences.

Generated on: $(date)
EOF

print_success "Created DATABASE_INFO.md with connection details"
echo ""
print_status "Database setup complete! 🚀"