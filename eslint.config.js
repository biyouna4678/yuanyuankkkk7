import html from "eslint-plugin-html";

export default [
    {
        plugins: {
            html
        },
        files: ["**/*.html"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "script",
            globals: {
                "window": "readonly",
                "document": "readonly",
                "console": "readonly",
                "setTimeout": "readonly",
                "clearTimeout": "readonly",
                "localStorage": "readonly",
                "prompt": "readonly",
                "confirm": "readonly",
                "alert": "readonly",
                "navigator": "readonly",
                "Date": "readonly",
                "Math": "readonly",
                "URL": "readonly",
                "Blob": "readonly",
                "Promise": "readonly",
                "File": "readonly",
                "FileReader": "readonly",
                "Alpine": "readonly",
                "fetch": "readonly"
            }
        }
    }
];
