export const defaultMailStyle = `
* {
    box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6, p {
    margin: 0;
}

html {
    background: rgba(128, 128, 128, .1);
}

.root {
    width: max-content;
    max-width: 100%;
    margin: auto;
    background: rgba(128, 128, 128, .1);
    padding: 20px;
    border-radius: 5px;
}

.root > * {
    margin-bottom: 5px;
}

.card {
    padding: 20px;
    background: rgba(128, 128, 128, .1);
    border-radius: 5px;
    max-width: max-content;
}

img {
    height: auto;
    width: 26px;
}

.small-text {
    font-size: .8em;
}

.grey {
    color: rgba(128, 128, 128, .7);
}
`;