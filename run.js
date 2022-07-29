const hinglish = require("./parser");

hinglish.run(`
    karo(man_lo(x, 0),
        man_lo(count, 1),
        jab_tak(<(count, 11),
                karo(man_lo(x, +(x, count)),
                man_lo(count, +(count,1)))),
            chaapo(count))

    `);
