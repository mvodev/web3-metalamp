export const getShortHash = (hash: string, startLength: number = 6, endLength: number = 6): string => {
  if (hash.length <= startLength + endLength) {
    return hash;
  }
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
};
