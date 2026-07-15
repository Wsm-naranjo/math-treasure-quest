/* Math Treasure Quest - Procedural Math Challenges Engine */

class MathEngine {
    constructor() {
        // Banks of questions to combine with procedural generator
        this.geometryQuestions = [
            {
                text: "Un prisma hexagonal tiene 6 caras laterales y 2 bases. ¿Cuántos vértices tiene en total?",
                choices: ["8", "12", "14", "16"],
                answer: "12"
            },
            {
                text: "Si los dos ángulos menores de un triángulo miden 35° y 65°, ¿cuánto mide el tercer ángulo?",
                choices: ["70°", "80°", "90°", "100°"],
                answer: "80°"  // debe coincidir EXACTAMENTE con el texto del botón
            },
            {
                text: "Un rectángulo tiene un perímetro de 36 cm. Si su altura es de 6 cm, ¿cuál es su área en cm²?",
                choices: ["36", "60", "72", "96"],
                answer: "72"
            },
            {
                text: "Un cilindro tiene un radio de 3 cm y una altura de 5 cm. ¿Cuál es el valor entero de su volumen si aproximamos π a 3?",
                choices: ["45", "90", "135", "180"],
                answer: "135"
            },
            {
                text: "¿Cuántas diagonales se pueden trazar desde un único vértice en un octágono regular?",
                choices: ["5", "6", "7", "8"],
                answer: "5"
            }
        ];
    }

    generateQuestion(category, level) {
        // category is 'arithmetic', 'algebra', or 'geometry'
        // level is 0, 1, 2 (representing difficulty steps on the island)

        switch (category) {
            case 'arithmetic':
                return this.generateArithmetic(level);
            case 'algebra':
                return this.generateAlgebra(level);
            case 'geometry':
                return this.generateGeometry(level);
            default:
                return this.generateArithmetic(0);
        }
    }

    generateArithmetic(level) {
        let text = "";
        let answer = 0;
        let type = 'input'; // Input field

        if (level === 0) {
            // Basic addition/subtraction
            const a = Math.floor(Math.random() * 50) + 10;
            const b = Math.floor(Math.random() * 40) + 5;
            if (Math.random() > 0.5) {
                text = `¿Cuánto es ${a} + ${b}?`;
                answer = a + b;
            } else {
                text = `¿Cuánto es ${a} - ${b}?`;
                answer = a - b;
            }
        } else if (level === 1) {
            // Multiplication and minor addition/subtraction
            const a = Math.floor(Math.random() * 12) + 4;
            const b = Math.floor(Math.random() * 11) + 3;
            const c = Math.floor(Math.random() * 20) + 5;

            if (Math.random() > 0.5) {
                text = `¿Cuánto es ${a} &times; ${b} + ${c}?`;
                answer = (a * b) + c;
            } else {
                text = `¿Cuánto es ${a} &times; ${b} - ${c}?`;
                answer = (a * b) - c;
            }
        } else {
            // Division with clean results or fractions
            const divisor = Math.floor(Math.random() * 8) + 3; // 3 to 10
            const answerMultiplier = Math.floor(Math.random() * 12) + 4; // 4 to 15
            const dividend = divisor * answerMultiplier;
            const extra = Math.floor(Math.random() * 15) + 2;

            text = `Calcula: (${dividend} &divide; ${divisor}) + ${extra}`;
            answer = answerMultiplier + extra;
        }

        return {
            category: 'Aritmética',
            text: text,
            type: type,
            answer: answer.toString()
        };
    }

    generateAlgebra(level) {
        let text = "";
        let answer = "";
        let type = 'input';

        if (level === 0) {
            // Arithmetic progression
            const start = Math.floor(Math.random() * 10) + 2;
            const step = Math.floor(Math.random() * 6) + 3;
            const seq = [start, start + step, start + 2 * step, start + 3 * step];
            text = `Completa la secuencia: ${seq.join(', ')},  __?`;
            answer = (start + 4 * step).toString();
        } else if (level === 1) {
            // Find X in basic equation: Ax + B = C
            const x = Math.floor(Math.random() * 8) + 3; // X is 3 to 10
            const a = Math.floor(Math.random() * 5) + 2; // A is 2 to 6
            const b = Math.floor(Math.random() * 15) + 1; // B is 1 to 15
            const c = (a * x) + b;

            text = `Resuelve para X:  ${a}x + ${b} = ${c}`;
            answer = x.toString();
        } else {
            // Geometric or Fibonacci-like sequence
            const typeChoice = Math.random() > 0.5;
            if (typeChoice) {
                // Geometric
                const start = Math.floor(Math.random() * 3) + 2; // 2, 3
                const ratio = Math.random() > 0.5 ? 2 : 3;
                const seq = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio];
                text = `Halla el siguiente término en la progresión geométrica: ${seq.join(', ')},  __?`;
                answer = (start * Math.pow(ratio, 4)).toString();
            } else {
                // Alternating sequence or square numbers
                const squares = [];
                const startNum = Math.floor(Math.random() * 4) + 1; // 1 to 4
                for (let i = 0; i < 4; i++) {
                    squares.push(Math.pow(startNum + i, 2));
                }
                text = `Completa el patrón cuadrático: ${squares.join(', ')},  __?`;
                answer = Math.pow(startNum + 4, 2).toString();
            }
        }

        return {
            category: 'Álgebra',
            text: text,
            type: type,
            answer: answer
        };
    }

    generateGeometry(level) {
        // Select from geometric question lists based on level
        const index = Math.min(level, this.geometryQuestions.length - 1);
        // Let's randomize a bit
        let q = this.geometryQuestions[index];

        // If they repeat, pick an offset
        if (level >= 2) {
            const randomOffset = Math.floor(Math.random() * (this.geometryQuestions.length - 2)) + 2;
            q = this.geometryQuestions[randomOffset];
        }

        return {
            category: 'Geometría y Lógica',
            text: q.text,
            type: 'choice', // Multiple choice
            choices: this.shuffleArray([...q.choices]),
            answer: q.answer
        };
    }

    // Helper to shuffle choices array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

export const mathEngine = new MathEngine();
export default mathEngine;
