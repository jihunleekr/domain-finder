import { exec } from "child_process";
import { Command } from "commander";

const program = new Command();

program
  .version("0.1.0")
  .option("-t, --tld <tld>", "top level domain", ".com")
  .option("-l, --length <length>", "domain length", "3")
  .option("-s, --start <start>", "domain starts with", "")
  .option("-e, --end <end>", "domain ends with", "")
  .parse(process.argv);

interface TNotFoundMessage {
  [key: string]: string;
}

const rootDomain = program.tld;
const charLength = parseInt(program.length);
const startChars = program.start;
const endChars = program.end;
const notFoundMessage: TNotFoundMessage = {
  ".ai": "No Object Found",
  ".app": "Domain not found",
  ".ca": "Not found",
  ".cn": "No matching record",
  ".co": "No Data Found",
  ".com": "is available for registration",
  ".de": "Status: free",
  ".eu": "Status: AVAILABLE", // 작동하지 않음
  ".gg": "NOT FOUND",
  ".id": "DOMAIN NOT FOUND",
  ".info": "NOT FOUND",
  ".io": "NOT FOUND",
  ".is": "No entries found for query",
  ".it": "AVAILABLE", // 작동하지 않음
  ".jp": "No match",
  ".kr": "The requested domain was not found",
  ".link": "is available for registration",
  ".me": "NOT FOUND",
  ".net": "No match for domain",
  ".org": "NOT FOUND",
  ".page": "Domain not found",
  ".ru": "No entries found", // 쿼리 제한 있음
  ".tv": "No match for domain",
  ".us": "No Data Found",
  ".vc": "NOT FOUND"
};

const getAtoZ = () => {
  let arr = [];
  let i = "a".charCodeAt(0);
  let j = "z".charCodeAt(0);
  for (; i <= j; ++i) {
    arr.push(String.fromCharCode(i));
  }
  return arr;
};

const permutator = (inputArr: string[], inputLength: number) => {
  let result: string[][] = [];
  const permuteRepl = (array: string[], n: number, eachElements: string[], outArr: string[][]) => {
    if (array.length == n) {
      outArr.push(JSON.parse(JSON.stringify(array)));
      return;
    }
    for (let el of eachElements) {
      array.push(el);
      permuteRepl(array, n, eachElements, outArr);
      array.pop();
    }
  };
  permuteRepl([], inputLength, inputArr, result);
  return result;
};

const checkDomain = (hostname: string, rootDomain: string) => {
  return new Promise(resolve => {
    exec("whois " + hostname + rootDomain, (_, stdout) => {
      let keyString: string = "";
      if (notFoundMessage.hasOwnProperty(rootDomain)) {
        keyString = notFoundMessage[rootDomain];
      }
      if (!keyString) {
        resolve(false);
      }
      const result = stdout.indexOf(keyString) === -1 ? false : true;
      resolve(result);
    });
  });
};

const checkDomains = (hostnames: string[], rootDomain: string) => {
  const promises = [];
  for (let i = 0; i < hostnames.length; i++) {
    promises.push(checkDomain(hostnames[i], rootDomain));
  }
  return Promise.all(promises);
};

// main
(async () => {
  if (notFoundMessage.hasOwnProperty(rootDomain)) {
    console.log("searching...", startChars + "".padStart(charLength, "?") + endChars + rootDomain);
    const length = 1000;
    const permutations = permutator(getAtoZ(), charLength);
    for (let j = 0; j < permutations.length; j += length) {
      let hostnames = [];
      for (let i = j; i < j + length; i++) {
        if (permutations[i]) {
          hostnames.push(startChars + permutations[i].join("") + endChars);
        }
      }
      const results = await checkDomains(hostnames, rootDomain);
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          console.log(hostnames[i] + rootDomain);
        }
      }
    }
  } else {
    console.log("Not Supported TLD");
  }
})();
