xport const generateOrderNumber = (): string => {
  const prefix = "ORD";
  const ts     = Date.now().toString().slice(-6);
  const rand   = Math.floor(100 + Math.random() * 900).toString();
  return `#${prefix}-${ts}${rand}`;
};
