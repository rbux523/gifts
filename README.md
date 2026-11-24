# Christmas wish lists

A small static website for the family’s Christmas wish lists. To preview it locally, run `python3 -m http.server` in this folder and open <http://localhost:8000>.

To publish with GitHub Pages, push these files to GitHub and enable Pages in the repository settings, using the root of the branch containing these files. Each list has a shareable URL such as `https://your-name.github.io/gifts/?person=ryan`.

Edit `data.json` to add wishes. Each person has a name, URL slug, decorative icon, and an `items` array. Each item can include a name, store, detail, product URL, and image URL. Product images hosted by retailers may change or stop working.
