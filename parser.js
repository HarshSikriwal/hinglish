//First step in making a programming language would be to design a parser. A parser takes as input the programme we've written as a string and then creates a data structure that defines the programme using the regex to identify patterns.

//All the programmes in our new language would be defined inside a do block.
//Our parser when first encounters a program should test if the program starts with a type value or type word. type value expressions will have either a string
// or a number at the starting.

//first we need to make our language white-space indifferent. So we'll need to gobble up the white space at the start of any program


function eatWhiteSpace(program) {
    //eats the whitespace at the start of a program.
    let pat = /\S/;
    let index = program.search(pat);
    if (index == -1) {return ""};
    return program.slice(index);

}

//Now we can write a function which when encountering a progam will first eat up the white space. Then, it'll look for a string, a number or anything that is symbol with some exceptions.

//any program in our new language can have a type number, string (both fall under type value), an operator (type apply and has a `(` after the keyword). We can make a simple function to deal with the 
// string or number types. But when there's an operator we may have to deal with it recursively

function parseExpression(program) {

    program = eatWhiteSpace(program);
    let match, expr;
    if (match = /^"([^"]*)"/.exec(program)) {

        expr = {type: "value", value: match[1]};

    } else if (match = /^\d+\b/.exec(program)) {

        expr = {type: "value", value: Number(match[0])};

    } else if (match = /^[^\s(),#"]+/.exec(program)) {

        expr = {type: "word", name: match[0]};

    } else {
        throw new SyntaxError("Didn't expect that syntax from you")
    }

    // Now that we have parsed the starting of the program we need to parse the rest of the program recursively.
    //There can be two cases for the rest of the program. Rest of the program may or may not be under the reign of an operator. If it's not then simply run parseExpression 
    //on the rest of the program again. But if it is then we have a new type `apply`. To deal with the second case we need to define another function which calls the parseExpression
    //on the contents inside the reign of an operator i.e inside the `(`. Let's callt 

    //if there's a `(` apply parse on the contents inside the `()`.
    return parseApply(expr, program.slice(match[0].length));

}

function parseApply(expr, program) {

    if (program[0] != '(') {

        return {expr: expr, rest: program};
    }

    //if rest of the program starts with `(`

    // program is anything after the first `(`
    program = eatWhiteSpace(program.slice(1));
    //since this part of the program falls under `(` it is of type apply.
    expr = {type: "apply", operator: expr, args: []};

    while (program[0] != ')') {

        //parse the args inside the ().
        let arg = parseExpression(program);
        expr.args.push(arg.expr);
        program = eatWhiteSpace(arg.rest);
        if (program[0] == ',') {

            program = eatWhiteSpace(program.slice(1));
        } else if (program[0] != ")"){
            throw new SyntaxError("Expected `,` or  `)`");
        }
        
    }

    return parseApply(expr, program.slice(1));

}


function parse(program) {

    let {expr, rest} = parseExpression(program);
    if (eatWhiteSpace(rest).length > 0) {

        console.log(rest);
        throw new SyntaxError("kya h ye bc");
    }
    return expr;

}

// console.log(parse("+(a,10)"));

/*-------------The Evaluator--------------*/
// we can feed in the evaluator the data structure that the parser spit out. Evaluator's job is to do appropriate things with appropriate types.

//some names are special like `if` , `while`. They need to be treated differently therfore they are stored in a different object.


let specialWords = Object.create(null);

function evaluate(expr, scope) {
    if (expr.type == "value") {

        return expr.value;
    } else if (expr.type == "word") {

        if (expr.name in scope) {
        
            return scope[expr.name];
        } else {
            throw new ReferenceError("Undefined Binding")
        }
    } else if (expr.type == "apply") {

        //type apply's operator can be a specialword or a function
        let {operator, args} = expr;
        if (operator.type == "word" && operator.name in specialWords) {

            return specialWords[operator.name](args, scope);
        } else {

            let op = evaluate(operator, scope);
            //if operator isn't some special keyword then it should be a function
            if (typeof op == "function") {

                return op(...args.map(arg => evaluate(arg, scope)));
            } else {
                throw new TypeError("wtf is this ?");
            }
        }

    }

}

//Define the if special keyword

specialWords.agar = (args, scope) => {

    if (args.length != 3) {
        throw new SyntaxError("if received invalid number of arguments");
    } else if (evaluate(args[0], scope) !== false) {
        return evaluate(args[1], scope);
    } else {
        return evaluate(args[2], scope);
    }


};

specialWords.jab_tak = (args, scope) => {

    // args to while should be of length 2. One specifies the condition at which to stop and another the thing to keep doing while the loop runs
    if (args.length != 2) {
        throw new SyntaxError("while received wrong number of args");
    }
    while (evaluate(args[0], scope) !== false) {
        evaluate(args[1], scope);
    }

    return false;
};

specialWords.karo = (args, scope) => {

    let value = false;
    for (let arg of args) {

        value = evaluate(arg, scope);
    }
    return value;
};

specialWords.man_lo = (args, scope) => {


    if (args.length != 2 || args[0].type != "word") {
        throw new SyntaxError("Incorrect");
    }
    let value = evaluate(args[1], scope);
    scope[args[0].name] = value;
    return value;
};




/*----Defining a default global scope-----*/

const globScope = Object.create(null);

globScope.sahi = true; //the true in our language is the javascript's true identifier
globScope.galat = false;


//now we can write a simple program
// let prog = parse(`if(true, false, true)`);
// console.log(evaluate(prog,globScope));

//defining all the arithmetic operations in the topscope

for (let op of ["+", "-", "*", "/", "==", "<", ">"]) {

    globScope[op] = Function("a, b", `return a ${op} b;`);
}

globScope.chaapo = value => {

    console.log(value);
    return value;
};

// let prog1 = parse(`if(>(4,5), print(2), print(3))`);
// evaluate(prog1, globScope);

//We can also allow a minimal syntax for writing functions in our language.

specialWords.func = (args, scope) => {

    //the last arg is the function body and rest of them are function parameters
    if (args.length == 0) {
        throw new SyntaxError("function doesn't have a body")
    }

    let body = args[args.length -1];
    let params = args.slice(0,args.length -1).map(expr => {

        if (expr.type != "word") {
            throw new SyntaxError("fun parameters must be names");
        }
        return expr.name;
    });

    return function() {

        if (arguments.length != params.length) {
            throw new SyntaxError("Incompatible number of arguments to the function")
        }
        //need to create a new local scope now whose prototype is the global scope.
        let localScope = Object.create(scope);
        for (let i =0; i < arguments.length; i++) {
            localScope[params[i]] = arguments[i];
        }
        return evaluate(body, localScope);
    };
};



// Adding support for array in the scope

globScope.array = (...args) => {

    let arr = [];
    for (let arg of args) {
        arr.push(arg);
    }
    return arr;
}

globScope.length = array => {

    if (Object.getPrototypeOf(array) != Array.prototype) {
        throw new SyntaxError("Invalid argument to length");
    }
    return array.length;

}

globScope.element = (array,elem) => {

    if (Object.getPrototypeOf(array) != Array.prototype || typeof elem != "number") {
        throw new SyntaxError("invalid type argument to element");
    } else if (elem > array.length -1) {
        throw new Error("invalid query into the array");
    }

    return array[elem];
}






function run(program) {

    return evaluate(parse(program), Object.create(globScope));
}

run(`
    karo(man_lo(x, 0),
        man_lo(count, 1),
        jab_tak(<(count, 11),
                karo(man_lo(x, +(x, count)),
                man_lo(count, +(count,1)))),
            chaapo(count))

    `);

