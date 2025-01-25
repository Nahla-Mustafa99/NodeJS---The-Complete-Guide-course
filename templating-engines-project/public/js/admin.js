const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector("[name = 'productId']").value;
  const csrf = btn.parentNode.querySelector("[name = '_csrf']").value;
  fetch("/admin/products/" + productId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      const prooductEl = btn.closest("article");
      // prooductEl.remove()
      prooductEl.parentNode.removeChild(prooductEl);
      console.log(result);
      return result.json();
    })
    .then((data) => console.log(data))
    .catch((err) => console.log("hello", err));
};
