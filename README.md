# GestureDocs

## What is GestureDocs
GestureDocs is hands-free gesture-powered text editor prototype for my currently on-going research. Through integrating gestures to activate the editing features while typing, we aim to deliver an intutive, seamless, and engaging writing experience. Unlike traditional feature-based manipulation, GestureDocs employs intent-based triggers. For selected high-level intents, we provide custom features and gestures that have contextual relevance. The following are the four intents and gestures the text editor provides.

Intent | Feature | Gesture
--- | --- | ---
To emphasize text | Bold | Head Nod
To make quick fixes | Delete text incrementally | Head Shake
To record additional thoughts | Comment | Head Tilt
To seek assistance | Open up ChatGPT Popup | Head Tilt Up

## Technologies Used
Used React.js (React Quill, Typescript, Tailwind) for Frontend, Node.js/Express for Backend. Levereged Google's MediaPipe FaceLandmarks for vision tasks and OpenAI API for ChatGPT Popup.

