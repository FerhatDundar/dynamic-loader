![NPM Version](https://img.shields.io/npm/v/%40infxios%2Fdynamic-loader)


`dynamic-loader` helps you run desired `Typescript` or `Javascript` after loading the specified `npm` packages.

- executeJavascript
- executeTypescript

```typescript
import { executeTypescript } from "dynamic-loader"
const packageContent = fs.readFileSync("test-package-0.1.0.tgz");
executeTypescript("test-app", [
  {
    packageName: "test-package",
    packageContent: packageContent
  }
], `
      import { testOperation } from "test-package";
      testOperation().then(() => {
        console.log("completed");
      }).catch((error) => {
        console.error(error);
      });
    `);
```






