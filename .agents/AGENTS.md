
## Branch Management
- ALWAYS push your commits to BOTH the `master` branch and the `main` branch, and to ALL remotes (`origin`, `render_repo`, and `fork`). The live Vercel deployment might pull from the `main` branch of the `fork` repository, so pushing only to `master` on `origin` will cause the user to not see any updates. Use `git push origin master && git push origin main && git push fork master && git push fork main && git push render_repo master && git push render_repo main` to ensure everything is updated.
