export default class TypeDetection {
  constructors: any[] = [];
  names: any[] = [];
  constructor() {
  }

  detectType(node: object) {
    if (!node.constructor) {
      return "Unknown";
    }
    const index = this.constructors.indexOf(node.constructor);
    if (index === -1) {
      return this.resolveType(node.constructor.name || "Anonymous", node, [
        node.constructor,
      ]);
    }
    return this.names[index];
  }

  resolveType(name: string, node: object, params: any[]) {
    const types: number[] = [];
    for (const i in this.constructors) {
      if (node instanceof this.constructors[i]) {
        types.push(+i);
      }
    }
    if (types.length === 0) {
      return name;
    }
    if (types.length === 1) {
      return name + ":" + this.names[types[0]];
    }
    const scores = [];
    for (let i = 0; i < types.length; i++) {
      const type = this.constructors[types[i]].prototype;
      scores[i] = 0;
      for (const j of types) {
        scores[i] += type instanceof this.constructors[j] ? 1 : 0;
      }
    }
    return name + " (" + this.names[types[indexOfMax(scores)]] + ")";
  }

  registerTypes(name: string, object: any, depth = 1) {
    if (depth === 0 || typeof object !== "object") {
      return;
    }
    for (const prop in object) {
      if (typeof object[prop] === "function") {
        this.constructors.push(object[prop]);
        this.names.push(name + prop);
      } else if (typeof object[prop] === "object") {
        this.registerTypes(name + prop + ".", object[prop], depth - 1);
      }
    }
  }
}
function indexOfMax(arr: any[]) {
  if (arr.length === 0) {
    return -1;
  }

  let max = arr[0];
  let maxIndex = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }

  return maxIndex;
}
