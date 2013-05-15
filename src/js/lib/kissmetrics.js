
// This is a hack.
// The KISSmetrics library is not an AMD module, so we use a shim. But it
// depends on a previously created global, so we define that here and use
// another shim config for this file.
window._kmq = [];
