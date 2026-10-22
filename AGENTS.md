<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Voting writes go only through the `cast_vote` database function; `votes` has no insert/update/delete policies — never add them (keeps the department/one-vote rules server-enforced).
- Student email/phone are hidden via column-level grants: always select `STUDENT_PUBLIC_COLUMNS` (src/lib/data.ts), never `*`, on `students`; admins read private fields via the `admin_list_students` RPC.
- Students self-register on /register and are signed in immediately (email auto-confirm on; /verify-email kept for code flow if re-enabled); on email confirmation a DB trigger links an existing students/admins row by email or creates a student row from sign-up metadata — keeps profile creation server-side. Admin privilege lives only in `user_roles`.
- Data reads use TanStack Query option factories in src/lib/data.ts and src/lib/admin.ts with the browser client (RLS applies); no server functions needed yet.
- Admin pages live under `src/routes/_authenticated/admin/`; the layout checks `has_role` and the root layout hides the public header there.
- Admin actions write an `audit_logs` row via `logAdminAction` (RLS requires admin_id = auth.uid()).
- Gratitude feeds share useLiveWishes for realtime invalidation and approved-query arrival detection; never announce raw realtime payloads because hidden posts must remain private.
- Gratitude post validation is shared in src/lib/gratitude.ts; render text-only posts in the shared pausable GratitudeMessages strip and video posts in portrait cards so both public feeds stay consistent.
- CapVideo owns the shared responsive portrait frame and uses object-contain so uploads remain intact without cropping or re-encoding.
- Public headshot and gratitude storage reads require exact references from active student profiles or approved posts; preserve authenticated own-folder and admin access so unused and hidden uploads stay private.
- Enforce hub/settings visibility and project-file sign-in requirements in database SELECT policies, not only in the interface, to protect direct requests.
- Department-owned projects use department_projects with admin-only writes; merge them with legacy projects in shared query factories and use each row's source for admin actions, preserving legacy data without dummy student accounts.
