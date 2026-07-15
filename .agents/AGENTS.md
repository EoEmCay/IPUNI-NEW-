
## Branch Management
- ALWAYS push your commits to BOTH the `master` branch and the `main` branch. The live Vercel deployment pulls from `main`, so pushing only to `master` will cause the user to not see any updates. Use `git push origin HEAD:master HEAD:main` or similar to ensure both are updated.
