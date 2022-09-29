module.exports = function getNightlyVersion(onlyDay = false) {
  const jsDate = new Date();
  return jsDate.getFullYear() +
    ('0' + (jsDate.getMonth() + 1)).slice(-2) +
    ('0' + (jsDate.getDate())).slice(-2) +
    (onlyDay ? "" :
      ('0' + (jsDate.getHours())).slice(-2) +
      ('0' + (jsDate.getMinutes())).slice(-2));
}
