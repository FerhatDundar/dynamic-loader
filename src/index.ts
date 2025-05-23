import fs from "fs";
import { createPackageJsonContent, createTsConfigContent } from "./file-contents";
import { ChainProcess, runChain } from "./command";



const prepareExecutionFolder = (folderName: string, packageName: string, packageContent: Buffer, expression: string, fileExtension: string): string => {

  const folderExists = fs.existsSync(folderName);
  if (!folderExists) {
    fs.mkdirSync(folderName, {
      recursive: true
    });
  }

  const packageFileName = `${folderName}/${packageName}.tgz`;
  const fileExists = fs.existsSync(packageFileName);
  if (!fileExists) {
    fs.writeFileSync(packageFileName, packageContent);
  }

  const packageJsonName = `${folderName}/package.json`;
  const packageJsonExists = fs.existsSync(packageJsonName);
  if (!packageJsonExists) {
    const packageJsonContent = createPackageJsonContent(packageName, `./${packageName}.tgz`, fileExtension);
    fs.writeFileSync(packageJsonName, packageJsonContent);
  }

  const indexFileName = `${folderName}/index.${fileExtension}`;
  const indexFileExists = fs.existsSync(indexFileName);
  if (!indexFileExists) {
    fs.writeFileSync(indexFileName, expression);
  }

  if (fileExtension == "ts") {
    const tsconfig = createTsConfigContent();
    const tsConfigFileName = `${folderName}/tsconfig.json`;
    const tsConfigFileExists = fs.existsSync(tsConfigFileName);
    if (!tsConfigFileExists) {
      fs.writeFileSync(tsConfigFileName, tsconfig);
    }
  }

  return folderName;
}

type PackageDetail = {
  packageName: string,
  packageContent: Buffer
}

export const executeJavascript = (appName: string, packages: PackageDetail[], expression: string): ChainProcess => {

  const folderName = `./${appName}`;

  for (const packageDetail of packages) {
    prepareExecutionFolder(appName, packageDetail.packageName, packageDetail.packageContent, expression, "js");
  }

  const chainProcess = runChain([
    {
      cmd: "npm install",
      ignoreStdout: true
    },
    "node index.js"
  ], {
    cwd: folderName
  });

  return chainProcess;

}


export const executeTypescript = (appName: string, packages: PackageDetail[], expression: string): ChainProcess => {

  const folderName = `./${appName}`;

  for (const packageDetail of packages) {
    prepareExecutionFolder(appName, packageDetail.packageName, packageDetail.packageContent, expression, "ts");
  }

  const chainProcess = runChain([
    {
      cmd: "npm install",
      ignoreStdout: true
    },
    {
      cmd: "npm run build",
      ignoreStdout: true
    },
    "npm run execute"
  ], {
    cwd: folderName
  });

  return chainProcess;

}



