const obj = { response: { data: "<html>404 Not Found</html>" }, message: "Request failed with status code 404" };
console.log(obj.response?.data?.message || obj.message || "fallback");
