# Christmas wish lists

A small static website for the family’s Christmas wish lists. To preview it locally, run `python3 -m http.server` in this folder and open <http://localhost:8000>.

To publish with GitHub Pages, push these files to GitHub and enable Pages in the repository settings, using the root of the branch containing these files. Each list has a shareable URL such as `https://your-name.github.io/gifts/?person=ryan`.

Edit `data.json` to add wishes. Each person has a name, URL slug, decorative icon, and an `items` array. Each item can include a name, store, `details` array for tags, product URL, and image URL. Product images hosted by retailers may change or stop working.

Ryan’s purchase checkboxes use a public Neon Function and a Postgres table. Anyone who visits the site can check or clear an item; no purchaser identity is stored. If someone else claims an item first, a competing claim is rejected. The page refreshes purchase status when it regains focus and every 30 seconds.

The backend lives in `api/`. After adding an item or changing a product URL, run `npm run build` in that folder to update the allowed item keys, then run `neon deploy` there to publish the updated API. Changing a product URL also changes its checkbox identity. Keep `.env.local` and other environment files private; they contain database credentials.
