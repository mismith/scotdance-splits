# Splits

Free online tool that splits highland dance competition registrations into age groups with bib numbers.

## Features

- **CSV Import**: Upload files from eventry.net, HDComps.com, or any registration system
- **Auto-grouping**: Algorithm splits dancers into balanced age groups
- **Bib numbering**: Reverse-registration-order with customizable starting numbers
- **Privacy-first**: All processing happens locally, data never leaves your computer
- **Export ready**: Output formatted for ScotDance.app or paper programs

## TODO

- read and use selected file name for Championship detection and export filename (e.g. Calgary Premiership 2025 -> Championship [x] + Calgary Premiership 2025 Grouped.csv)
- age group min-size detection (e.g. no less than 5 people)
- input setting to detect scrutineer code from words + age, age from birthday, etc
- input data preview + settings + better error handling (e.g. Ready to export in green is ugly)
- useLocalStorage for settings + showDancers
- drag n drop groups on mobile
- when you have unsaved changes, prompt before unloading (or leaving route)
