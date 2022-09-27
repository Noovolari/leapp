module.exports = function getNightlyVersion() {
  const jsDate = new Date();
  return jsDate.getFullYear() +
    ('0' + (jsDate.getMonth() + 1)).slice(-2) +
    ('0' + (jsDate.getDate())).slice(-2) +
    ('0' + (jsDate.getHours())).slice(-2) +
    ('0' + (jsDate.getMinutes())).slice(-2);
}
