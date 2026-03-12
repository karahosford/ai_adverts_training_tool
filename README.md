# Spot The Synthetic

A Tinder-style survey prototype for testing whether participants can classify AI-generated versus real content.

## What This Prototype Includes

- Information + consent page with explicit `I Give Consent` flow
- Profile setup page with common demographic survey fields
- Swipe-based classification game:
  - Left swipe/click = `AI-generated`
  - Right swipe/click = `Real`
- Mobile-first interaction with desktop button support
- Results page with:
  - Individual accuracy
  - Average response time
  - Estimated percentile versus local participants
- Research data capture and exports:
  - Download single-session JSON
  - Download single-session CSV
  - Download all locally stored sessions JSON
- Research Dashboard:
  - Filter by age group, gender, and AI familiarity
  - Confusion matrix (truth vs participant guess)
  - Segment-level mean score table
- Dataset Builder to add, remove, import, and export image cards

## File Structure

- `index.html` - App views and layout
- `styles.css` - Mobile-first visual design and animations
- `app.js` - Survey logic, swipe controls, scoring, storage, exports
- `data/default-dataset.json` - Starter dataset
- `assets/images/*.svg` - Bundled sample cards

## Local Testing

Because the app fetches `data/default-dataset.json`, run it through a local web server:

```bash
cd /home/kara/Documents/Github/ai_adverts_training_tool
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages Deployment

1. Push this folder to a GitHub repository.
2. In repository settings, enable GitHub Pages from the main branch root.
3. Open the provided Pages URL.

## Research Notes

- Storage is browser-local (`localStorage`) in this prototype.
- For production research collection, connect exports to a backend endpoint (for example, Azure Function, Firebase, Supabase, or API gateway) so sessions are centrally aggregated.
- Uploaded dataset images are stored as base64 in local storage and can be exported as JSON.
