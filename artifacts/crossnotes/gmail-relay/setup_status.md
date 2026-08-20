# Gmail relay setup status

The Google Apps Script project **CrossNotes Gmail Relay** was created under **support.crossnotes@gmail.com**.

- Apps Script project ID: `1Z76Sa9rgb31od4Jj6BXQLIyPmGYY5aZ2VOr7LFlsdZAAniqmyBsyBi6m`
- Source: `Code.gs` was inserted into the project.
- Remaining setup: set `RELAY_SECRET` and `ALLOWED_RECIPIENT` script properties, deploy as a web app, and approve the Gmail-send OAuth scope.

The corrected `Code.gs` now validates in the Apps Script editor: the selectable function changed to `doGet`, confirming that the syntax error was removed. The official web-app deployment URL remains unchanged, but a fresh deployment version is still required after the source/runtime changes. The two required script properties are `RELAY_SECRET` and `ALLOWED_RECIPIENT`; the settings UI presents an **Add script property** control below the visible general-settings area.
