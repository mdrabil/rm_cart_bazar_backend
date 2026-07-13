// export const calculateGrowth = (current, previous) => {
//   if (!previous || previous === 0) {
//     return {
//       percentage: 100,
//       trend: "increase",
//       increased: true,
//     };
//   }

//   const diff = ((current - previous) / previous) * 100;

//   return {
//     percentage: Math.abs(Number(diff.toFixed(2))),
//     trend: diff >= 0 ? "increase" : "decrease",
//     increased: diff >= 0,
//   };
// };

export const calculateGrowth = (current, previous) => {
  // CASE 1: no data both sides
  if (previous === 0 && current === 0) {
    return {
      percentage: 0,
      trend: "no-change",
      increased: false,
    };
  }

  // CASE 2: new data started (0 -> something)
  if (previous === 0 && current > 0) {
    return {
      percentage: 100,
      trend: "increase",
      increased: true,
    };
  }

  // CASE 3: everything dropped to zero
  if (previous > 0 && current === 0) {
    return {
      percentage: 100,
      trend: "decrease",
      increased: false,
    };
  }

  // NORMAL CASE
  const diff = ((current - previous) / previous) * 100;

  return {
    percentage: Math.abs(Number(diff.toFixed(2))),
    trend: diff >= 0 ? "increase" : "decrease",
    increased: diff >= 0,
  };
};