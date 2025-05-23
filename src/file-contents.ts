
export const createTsConfigContent = (): string => {
    return `
    {
      "compilerOptions": {
        "target": "ES2019",            // OK for Node 18+
        "module": "CommonJS",          // keep in sync with package.json "type"
        "rootDir": ".",
        "outDir": "./dist",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
      },
      "exclude": ["node_modules"]
    }`;
}

export const createPackageJsonContent = (packageName: string, packageLocation: string, fileExtension: string): string => {

    if (fileExtension == "ts") {
        return `
      {
        "name": "local-execution",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
          "build": "tsc",        
          "start": "npm run build && node dist/index.js",
          "execute": "node dist/index.js"
        },
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
          "${packageName}": "file:${packageLocation}"
        },
        "devDependencies": {
          "typescript": "^5.4.0"
        },
        "engines": {
          "node": ">=18"
        }
      }`;
    } else {
        return `
      {
        "name": "local-execution",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
          "test": "echo \\"Error: no test specified\\" && exit 1"
        },
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
          "${packageName}": "file:${packageLocation}"
        }
      }`;
    }

}