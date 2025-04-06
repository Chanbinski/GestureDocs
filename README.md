# GestureDocs

## What is GestureDocs
GestureDocs is hands-free gesture-powered text editor prototype for my currently on-going research. Through integrating gestures to activate the editing features while typing, we aim to deliver an intuitive, seamless, and engaging writing experience. Unlike traditional feature-based manipulation, GestureDocs employs intent-based triggers. For selected high-level intents, we provide custom features and gestures that have contextual relevance. The following are the four intents and gestures the text editor provides. Here's a [demo](https://www.loom.com/share/bc04e21d08b3497291eea773b578a2a7?sid=79b18f9a-5dbe-43e4-8c6d-891f7ebb246c).

Intent | Feature | Gesture | Context
--- | --- | --- | ---
To emphasize text | Bold | Head Nod | Express importance
To make quick fixes | Delete text incrementally | Head Shake | Denial
To record additional thoughts | Comment | Head Tilt | Confusion
To seek assistance | Open up ChatGPT Popup (Currently Disabled) | Head Tilt Up | Frustration

## Technologies Used
Used React.js (React Quill, Typescript, Tailwind) for Frontend, Node.js/Express for Backend. Levereged Google's MediaPipe FaceLandmarks for vision tasks and OpenAI API for ChatGPT Popup.

