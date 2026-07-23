from pathlib import Path

app_path = Path("app.js")
text = app_path.read_text(encoding="utf-8")
old = '''  const MANUFACTURER_NOTES = {
    Lund: "Current and many recent Lund families use SS for side console, Sport for a full windshield, and Tiller for tiller steering. That is not a timeless rule for every Lund ever built. Older paperwork may say Lund American, which is manufacturer wording rather than a model name. Verify the year, full family name, length designation, layout suffix, HIN, and capacity plate."
  };'''
new = '''  const MANUFACTURER_NOTES = {
    Lund: "Current and many recent Lund families use SS for side console, Sport for a full windshield, and Tiller for tiller steering. That is not a timeless rule for every Lund ever built. Older paperwork may say Lund American, which is manufacturer wording rather than a model name. Verify the year, full family name, length designation, layout suffix, HIN, and capacity plate.",
    Princecraft: "Princecraft suffixes are layout and trim clues, not interchangeable model names. WS means windshield, SC means side console, BT means back-troller, and DL, DLX, SE, or MAX describe a series or trim level that can change by year. Princecraft also renamed some nearly identical hulls, including Sport 167 becoming Sport 164. Verify the year, complete model name, suffix, HIN, and capacity plate before matching a listing."
  };'''

if text.count(old) != 1:
    raise SystemExit("Expected manufacturer-note block was not found exactly once")

app_path.write_text(text.replace(old, new), encoding="utf-8")
Path("scripts/apply_princecraft_note.py").unlink()
Path(".github/workflows/apply-princecraft-note.yml").unlink()
