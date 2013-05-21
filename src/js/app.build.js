({
    appDir: "../",
    baseUrl: "js",
    dir: "../../dashboard-build",
    mainConfigFile: 'common.js',
    modules: [
        {
            name: "common",
            include: ["jquery"]
        },
        {
            name: "main",
            exclude: ["common"]
        },
        {
            name: "main_newsurvey",
            exclude: ["common"]
        }
    ],
    fileExclusionRegExp: /^\./,
})
