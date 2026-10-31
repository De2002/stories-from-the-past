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

- Post images live in the private `post-images` bucket (public buckets are blocked by workspace policy); `posts.image_url` stores either a `/seed/...` public path or a storage path resolved to a signed URL by `PostImage`.
- Embeds from posts/comments to profiles must name the FK (`profiles!posts_user_id_fkey`) because likes/saves create ambiguous many-to-many paths.
