import React from 'react';

const HtmlGenerator = ({ selectedDistribution }) => {
    const generateHtml = () => {
        const html = `
<!DOCTYPE html>
<html>
<title>Distribution Playground</title>
<style>
    body {
        font-family: sans-serif;
    }

    #container {
        width: 600px;
        height: 400px;
        border: none;
        margin: 0 auto;
    }

    #alpha,
    #beta {
        width: 100%;
    }

    #output {
        font-size: 16px;
        margin-top: 10px;
    }
</style>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\(', '\\)']],
                displayMath: [['\\[', '\\]']]
            },
            svg: {
                fontCache: 'global'
            }
        };
    </script>
    <script id="MathJax-script" src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

</head>

<body>
    <h1>Distribution Playground</h1>
    <svg></svg>
    <div id="controlPanelsContainer">
    </div>
    <div id="legend"></div>

    <button id="addGraphButton">Add Graph</button>
    <div>
        <label for="minX">Adjust X-axis: Min</label>
        <input type="number" step="1" value="0" id="minX">
        <label for="maxX">Max</label>
        <input type="number" step="1" value="1" id="maxX">
        <label for="maxY">Max Y</label>
        <input type="number" step="0.1" value="3.9" id="maxY">
        <button id="update">updateBounds automatically</button>
    </div>

    <a id="canvasDownload" href="#" download="beautiful_graph.svg">download</a>
    <script src="https://d3js.org/d3.v4.min.js"></script>
    <script src="
https://cdn.jsdelivr.net/npm/mathjs@13.0.0/lib/browser/math.min.js
"></script>
    <script>
        const margin = { top: 70, right: 30, bottom: 40, left: 80 };
        let svgWidth = 1200 - margin.left - margin.right;
        let svgHeight = 500 - margin.top - margin.bottom;
        let svg = d3.select('svg').attr('width', svgWidth + margin.left + margin.right).attr('height', svgHeight + margin.top + margin.bottom).append('g').attr('transform', \`translate(\${margin.left}, \${margin.top})\`);

        //create axises
        let xs = d3.scaleLinear().range([0, svgWidth]);
        let ys = d3.scaleLinear().range([svgHeight, 0]);
        let calibrateY = 100;
        const graphs = [];
        const trashCan = [];
        const scaleAlongY = document.getElementById('y');
        const scaleAlongX = document.getElementById('x');
        const scaleAlongYNumber = document.getElementById('yn');
        const scaleAlongXNumber = document.getElementById('xn');
        const legendContainer = document.getElementById('legend');
        const colors = ['#FF0000', '#0000FF', '#800080', '#008000', '#000000'];
        const canvasDownload = document.getElementById('canvasDownload');
        var maxY = 3.9;
        var maxX = 1;
        var minX = 0;
        var xAdjust = 0;
        var quantile = 0.4;
        function addGraph() {
            //default values
            const newGraph = {
                alpha: 5.8,
                beta: 11.5,
                gamma: 5,
                quantile: 0.4,
                distribution: 'beta',
                color: colors[graphs.length % colors.length],
                d: [],
                xPosition: 0.5,
                cdf: [],
                init: true,
                showShadedArea: false,
                discrete: false,
                range: 100

            }
            graphs.push(newGraph)

            createControlPanel(newGraph);
            updateChart()
            safeMathJaxTypeset();
        }

        function createControlPanel(graph) {
            const controlPanel = document.createElement('div');
            //add unique id
            controlPanel.id = \`controlPanel\${graphs.indexOf(graph)}\`;
            //style it
            controlPanel.style.padding = '10px';
            controlPanel.style.borderRadius = '5px';
            controlPanel.style.margin = '10px';
            //create lengend
            const legendItem = document.createElement('div');
            legendItem.textContent = \`Graph \${graphs.indexOf(graph) + 1}\`;
            controlPanel.appendChild(legendItem);
            //add alpha and beta sliders
            const partA = document.createElement('div');
            const partB = document.createElement('div');
            const alphaSlider = document.createElement('input');
            const alphaNumber = document.createElement('input');
            const betaSlider = document.createElement('input');
            const betaNumber = document.createElement('input');
            const alphaLabel = document.createElement('label');
            const betaLabel = document.createElement('label');
            alphaLabel.textContent = 'Alpha: ';
            partA.appendChild(alphaLabel);
            alphaSlider.type = 'range';
            alphaSlider.min = 0.1;
            alphaSlider.max = 10;
            alphaSlider.step = 0.1;
            alphaSlider.value = graph.alpha;
            alphaSlider.addEventListener('change', function () {
                graph.alpha = parseFloat(this.value);
                alphaNumber.value = graph.alpha;
                graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                updateChart();
            })
            partA.appendChild(alphaSlider);
            alphaNumber.type = 'number';
            alphaNumber.min = 0.1;
            alphaNumber.max = 10;
            alphaNumber.step = 0.1;
            alphaNumber.value = graph.alpha;
            alphaNumber.addEventListener('change', function () {
                graph.alpha = parseFloat(this.value);
                alphaSlider.value = graph.alpha;
                graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                updateChart();
            })
            partA.appendChild(alphaNumber);
            betaLabel.textContent = 'Beta: ';
            partB.appendChild(betaLabel);
            betaSlider.type = 'range';
            betaSlider.min = 0.1;
            betaSlider.max = 20;
            betaSlider.step = 0.1;
            betaSlider.value = graph.beta;
            betaSlider.addEventListener('change', function () {
                graph.beta = parseFloat(this.value);
                betaNumber.value = graph.beta;
                graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                updateChart();
                //make sure k is always less than or equal to n when it is hypergeometric distribution
                if (graph.distribution == 'hypergeometric') {
                    if (graph.gamma < graph.beta) {
                        graph.beta = graph.gamma;
                       beta.value = graph.gamma
                       gammaSlider.value = graph.alpha;
                    }
                }
            })
            partB.appendChild(betaSlider);
            betaNumber.type = 'number';
            betaNumber.min = 0.1;
            betaNumber.max = 20;
            betaNumber.step = 0.1;
            betaNumber.value = graph.beta;
            betaNumber.addEventListener('change', function () {
                graph.beta = parseFloat(this.value);
                betaSlider.value = graph.beta;
                graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                updateChart();
                if (graph.distribution == 'hypergeometric') {
                    if (graph.gamma > graph.beta) {
                        graph.gamma = graph.beta;
                       gammaNumber.value = graph.alpha;
                       gammaSlider.value = graph.alpha;
                    }
                }
            })
            partB.appendChild(betaNumber);
            //create part c for gamma
            const partC = document.createElement('div');
            const gammaSlider = document.createElement('input');
            const gammaNumber = document.createElement('input');
            const gammaLabel = document.createElement('label');
            gammaLabel.textContent = '';
            partC.appendChild(gammaLabel);
            gammaSlider.type = 'range';
            gammaSlider.min = 0.1;
            gammaSlider.max = 10;
            gammaSlider.step = 0.1;
            gammaSlider.value = graph.gamma;
            gammaSlider.addEventListener('change', function () {
                console.log(this.value);
                graph.gamma = parseFloat(this.value);
                gammaNumber.value = graph.gamma;
                updateChart();
            })
            gammaSlider.style.display = 'none';
            partC.appendChild(gammaSlider);
            gammaNumber.type = 'number';
            gammaNumber.min = 0.1;
            gammaNumber.max = 10;
            gammaNumber.step = 0.1;
            gammaNumber.value = graph.gamma;
            gammaNumber.addEventListener('change', function () {
                console.log(this.value);
                graph.gamma = parseFloat(this.value);
                gammaSlider.value = graph.gamma;
                updateChart();
            })
            gammaNumber.style.display = 'none';
            partC.appendChild(gammaNumber);
            controlPanel.appendChild(partA);
            controlPanel.appendChild(partB);
            controlPanel.appendChild(partC);
            //add quantile slider
            const quantileSlider = document.createElement('input');
            const quantileLabel = document.createElement('label');
            quantileLabel.textContent = 'Quantile: ';
            controlPanel.appendChild(quantileLabel);
            quantileSlider.type = 'range';
            quantileSlider.min = 0.1;
            quantileSlider.max = 0.9;
            quantileSlider.step = 0.1;
            quantileSlider.value = quantile;
            //input for quantile value
            const quantileNumber = document.createElement('input');
            quantileNumber.type = 'number';
            quantileNumber.step = 0.1;
            quantileNumber.value = quantile;
            quantileSlider.addEventListener('change', function () {
                graph.quantile = parseFloat(this.value);
                quantile = graph.quantile;
                quantileNumber.value = graph.quantile;
                if (graph.distribution == 'uniform') {
                    graph.xPosition = quantileUniform(graph.alpha, graph.beta, graph.quantile);
                } else {
                    graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                    if (graph.distribution == 'normal') {
                        console.log(quantileNormal(graph.quantile, graph.alpha, graph.beta));
                        graph.xPosition = graph.xPosition * maxX;
                    }
                }
                updateChart();
            })
            controlPanel.appendChild(quantileSlider);
            quantileNumber.addEventListener('change', function () {
                graph.quantile = parseFloat(this.value);
                quantile = graph.quantile;
                quantileSlider.value = graph.quantile;
                if (graph.distribution == 'uniform') {
                    graph.xPosition = quantileUniform(graph.alpha, graph.beta, graph.quantile);
                } else {
                    graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                    if (graph.distribution == 'normal') {
                        graph.xPosition = graph.xPosition * maxX;
                    }
                }
                updateChart();
            })
            controlPanel.appendChild(quantileNumber);

            //checkbox for shaded area
            const shadedAreaCheckbox = document.createElement('input');
            shadedAreaCheckbox.type = 'checkbox';
            shadedAreaCheckbox.id = \`shadedArea\${graphs.indexOf(graph)}\`;
            shadedAreaCheckbox.addEventListener('change', function () {
                graph.showShadedArea = this.checked;
                updateChart();
            })
            controlPanel.appendChild(shadedAreaCheckbox);

            //label for x location output
            const quantileOutputLabel = document.createElement('label');
            quantileOutputLabel.textContent = 'x: ';
            controlPanel.appendChild(quantileOutputLabel);


            //input and also output for calculated quantile location eg. x = 0.5
            const quantileOutput = document.createElement('input');
            //id with index
            quantileOutput.id = \`output\${graphs.indexOf(graph)}\`;
            //set default value
            quantileOutput.value = 0.5;
            //add event listener for the output
            quantileOutput.addEventListener('change', function () {
                graph.xPosition = parseFloat(this.value);
                //update the graph.quantile
                graph.quantile = reverseTrapezoidalQuantile(graph.xPosition, graph.cdf);
                //update the quantile slider
                quantileSlider.value = graph.quantile;
                quantileNumber.value = graph.quantile;
                updateChart();
            })
            controlPanel.appendChild(quantileOutput);
            // document.getElementById('output').value = graph.xPosition;
            //input color
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = graph.color;
            colorInput.addEventListener('change', function () {
                graph.color = this.value;
                updateChart();
            })
            controlPanel.appendChild(colorInput);

            //dropdown menu for distribution
            const formula = document.createElement('div');
            controlPanel.appendChild(formula);
            formula.id = \`formula\${graphs.indexOf(graph)}\`;
            const distributionLabel = document.createElement('label');
            distributionLabel.textContent = 'Distribution: ';
            controlPanel.appendChild(distributionLabel);
            const distributionSelect = document.createElement('select');
            const betaOption = document.createElement('option');
            betaOption.value = 'beta';
            betaOption.textContent = 'Beta';
            const gammaOption = document.createElement('option');
            gammaOption.value = 'gamma';
            gammaOption.textContent = 'Gamma';
            const normalOption = document.createElement('option');
            normalOption.value = 'normal';
            normalOption.textContent = 'Normal';
            const uniformOption = document.createElement('option');
            uniformOption.value = 'uniform';
            uniformOption.textContent = 'Uniform';
            const distributionOption = document.createElement('option');
            distributionOption.value = 'exponential';
            distributionOption.textContent = 'Exponential';
            const chiSquaredOption = document.createElement('option');
            chiSquaredOption.value = 'chiSquared';
            chiSquaredOption.textContent = 'Chi-Squared';
            const studentTOption = document.createElement('option');
            studentTOption.value = 'studentT';
            studentTOption.textContent = 'Student\\'s t';
            const snedecorFOption = document.createElement('option');
            snedecorFOption.value = 'snedecorF';
            snedecorFOption.textContent = 'Snedecor\\'s F';
            const binomialOption = document.createElement('option');
            binomialOption.value = 'binomial';
            binomialOption.textContent = 'Binomial';
            const bernoulliOption = document.createElement('option');
            bernoulliOption.value = 'bernoulli';
            bernoulliOption.textContent = 'Bernoulli';
            const geometricOption = document.createElement('option');
            geometricOption.value = 'geometric';
            geometricOption.textContent = 'Geometric';
            const poissonOption = document.createElement('option');
            poissonOption.value = 'poisson';
            poissonOption.textContent = 'Poisson';
            const negativeBinomialOption = document.createElement('option');
            negativeBinomialOption.value = 'negativeBinomial';
            negativeBinomialOption.textContent = 'Negative Binomial';
            const hypergeometricOption = document.createElement('option');
            hypergeometricOption.value = 'hypergeometric';
            hypergeometricOption.textContent = 'Hypergeometric';


            selected = [${//print out the selected distribution
    selectedDistribution.map(d => `'${d}'`).join(', ')
                }]
            if (selected.includes('beta')) {
    distributionSelect.appendChild(betaOption);
}
if (selected.includes('normal')) {
    distributionSelect.appendChild(normalOption);
}
if (selected.includes('gamma')) {
    distributionSelect.appendChild(gammaOption);
}
if (selected.includes('uniform')) {
    distributionSelect.appendChild(uniformOption);
}
if (selected.includes('distribution')) {
    distributionSelect.appendChild(distributionOption);
}
if (selected.includes('chiSquared')) {
    distributionSelect.appendChild(chiSquaredOption);
}
if (selected.includes('studentT')) {
    distributionSelect.appendChild(studentTOption);
}
if (selected.includes('snedecorF')) {
    distributionSelect.appendChild(snedecorFOption);
}
if (selected.includes('binomial')) {
    distributionSelect.appendChild(binomialOption);
}
if (selected.includes('bernoulli')) {
    distributionSelect.appendChild(bernoulliOption);
}
if (selected.includes('geometric')) {
    distributionSelect.appendChild(geometricOption);
}
if (selected.includes('poisson')) {
    distributionSelect.appendChild(poissonOption);
}
if (selected.includes('negativeBinomial')) {
    distributionSelect.appendChild(negativeBinomialOption);
}
if (selected.includes('hypergeometric')) {
    distributionSelect.appendChild(hypergeometricOption);
}
            distributionSelect.addEventListener('change', function () {
                graph.distribution = this.value;
                graph.init = true;
                betaNumber.style.display = 'inline';
                betaSlider.style.display = 'inline';

                //update the parameters control panel for new distribution
                //update the formula with mathjax
                if (this.value == 'beta' || this.value == 'gamma') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'Alpha: ';
                    betaLabel.textContent = 'Beta: ';
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'normal') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'Mean: ';
                    betaLabel.textContent = 'Standard Deviation: ';
                    graph.alpha = 0.5;
                    graph.beta = 0.1;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'uniform') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'Lower Bound: ';
                    betaLabel.textContent = 'Upper Bound: ';
                    graph.alpha = 0.2;
                    graph.beta = 0.8;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'exponential') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'Lambda: ';
                    betaLabel.textContent = '';
                    graph.alpha = 0.5;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'chiSquared') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'K: ';
                    betaLabel.textContent = '';
                    graph.alpha = 2;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'studentT') {
                    graph.discrete = false;
                    alphaLabel.textContent = 'v: ';
                    betaLabel.textContent = '';
                    graph.alpha = 2;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                } else if (this.value == 'binomial') {
                    graph.discrete = true;
                    graph.range = graph.alpha;
                    alphaLabel.textContent = 'n: ';
                    betaLabel.textContent = 'p: ';
                    graph.alpha = 10;
                    graph.beta = 0.5;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'snedecorF') {
                    graph.discrete = true;
                    alphaLabel.textContent = 'm: ';
                    betaLabel.textContent = 'n: ';
                    graph.alpha = 2;
                    graph.beta = 2;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'bernoulli') {
                    graph.discrete = true;
                    alphaLabel.textContent = 'p: ';
                    betaLabel.textContent = '';
                    graph.alpha = 0.5;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                } else if (this.value == 'geometric') {
                    graph.discrete = true;
                    alphaLabel.textContent = 'p: ';
                    betaLabel.textContent = '';
                    graph.alpha = 0.5;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'poisson') {
                    graph.discrete = true;
                    alphaLabel.textContent = 'Lambda: ';
                    betaLabel.textContent = '';
                    graph.alpha = 0.5;
                    graph.beta = 0;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    //remove beta label and input space
                    betaSlider.style.display = 'none';
                    betaNumber.style.display = 'none';
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'negativeBinomial') {
                    graph.discrete = true;
                    alphaLabel.textContent = 'r: ';
                    betaLabel.textContent = 'p: ';
                    graph.alpha = 2;
                    graph.beta = 0.5;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaLabel.textContent = '';
                    gammaNumber.style.display = 'none';
                    gammaSlider.style.display = 'none';
                } else if (this.value == 'hypergeometric') {
                    graph.discrete = true;
                    gammaLabel.textContent = 'n: ';
                    alphaLabel.textContent = 'N: ';
                    betaLabel.textContent = 'K: ';
                    graph.alpha = 10;
                    graph.beta = 5;
                    alphaSlider.value = graph.alpha;
                    alphaNumber.value = graph.alpha;
                    betaSlider.value = graph.beta;
                    betaNumber.value = graph.beta;
                    gammaSlider.value = graph.gamma;
                    gammaNumber.value = graph.gamma;
                    gammaSlider.style.display = 'inline';
                    gammaNumber.style.display = 'inline';
                }
                updateChart();

            })
            controlPanel.appendChild(distributionSelect);
            //create delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', function () {
                //put the graph index to the trashCan
                trashCan.push(graphs.indexOf(graph));
                //re draw the entire control panel container while filter out the one got deleted
                document.getElementById('controlPanelsContainer').innerHTML = '';
                graphs.forEach(graph => {
                    if (!trashCan.includes(graphs.indexOf(graph))) {
                        createControlPanel(graph);
                    }
                })


                //controlPanel.remove();
                updateChart();
            })
            controlPanel.appendChild(deleteButton);




            //add the control panel to the container
            document.getElementById('controlPanelsContainer').appendChild(controlPanel)
        }


        //exponential distribution
        function exponentialPDF(x, lambda) {
            // Exponential probability density function implementation
            return gammaPDF(x, 1, lambda)
        }

        function lnExponentialPDF(x, lambda) {
            // Log of the Exponential Probability Density Function
            return Math.log(lambda) - lambda * x
        }

        //chi-squared distribution
        function chiSquaredPDF(x, k) {
            // Chi-Squared probability density function implementation
            return gammaPDF(x, k / 2, 0.5)
        }

        //student's t distribution with math.gamma function
        function studentTPDF(x, v) {
            return math.gamma((v + 1) / 2) / (math.gamma(v / 2) * Math.sqrt(v * Math.PI)) * Math.pow(1 + Math.pow(x, 2) / v, -(v + 1) / 2);
        }

        //Snedecor's F distribution with math.gamma function
        function snedecorFPDF(x, m, n) {
            return math.gamma((m + n) / 2) * Math.pow(m / n, m / 2) * Math.pow(x, m / 2 - 1) / (math.gamma(m / 2) * math.gamma(n / 2) * Math.pow(1 + m / n * x, (m + n) / 2));
        }

        //Binomial distribution
        function binomialPDF(x, n, p) {
            if (x < 0 || x > n) {
                return 0;
            }
            //make sure the x is integer and n is integer
            x = Math.round(x);
            n = Math.round(n);
            return math.combinations(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
        }

        //Bernoulli distribution
        function bernoulliPDF(x, p) {
            return binomialPDF(x, 1, p);
        }

        //Geometry distribution
        function geometricPDF(x, p) {
            return Math.pow(1 - p, x - 1) * p;
        }

        //Poisson distribution
        function poissonPDF(x, lambda) {
            return Math.exp(-lambda) * Math.pow(lambda, x) / math.factorial(x);
        }

        //negative binomial distribution
        function negativeBinomialPDF(x, r, p) {
            return math.combinations(x + r - 1, x) * Math.pow(p, r) * Math.pow(1 - p, x);
        }

        //hypergeometric distribution
        function hypergeometricPDF(x, N, K, n) {
            //avoid error for combination function
            if (x < 0 || x > n) {
                return 0;
            }
            return math.combinations(K, x) * math.combinations(N - K, n - x) / math.combinations(N, n);
        }



        function betaPDF(x, a, b) {
            // Beta probability density function impementation
            return Math.exp(lnBetaPDF(x, a, b))
        }
        function lnBetaPDF(x, a, b) {
            // Log of the Beta Probability Density Function
            return ((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)) - lnBetaFunc(a, b)
        }

        function lnBetaFunc(a, b) {
            // Log Beta Function
            // ln(Beta(x,y))
            foo = 0.0;

            for (i = 0; i < a - 2; i++) {
                foo += Math.log(a - 1 - i);
            }
            for (i = 0; i < b - 2; i++) {
                foo += Math.log(b - 1 - i);
            }
            for (i = 0; i < a + b - 2; i++) {
                foo -= Math.log(a + b - 1 - i);
            }
            return foo
        }

        //normal distribution
        function normalPDF(x, mean, stdDev) {
            // Normal probability density function implementation
            return Math.exp(lnNormalPDF(x, mean, stdDev))
        }

        function lnNormalPDF(x, mean, stdDev) {
            // Log of the Normal Probability Density Function
            return -0.5 * Math.log(2 * Math.PI) - Math.log(stdDev) - 0.5 * Math.pow((x - mean) / stdDev, 2)
        }

        //uniform distribution
        function uniformPDF(x, a, b) {
            // Uniform probability density function implementation
            return (x >= a && x <= b) ? 1 / (b - a) : 0
        }

        function quantileUniform(a, b, p) {
            // Quantile function for the uniform distribution
            console.log(a + p * (b - a));
            return a + p * (b - a);
        }

        //new gamma pdf function with math js
        function gammaPDF(x, a, b) {
            return math.pow(b, a) * math.pow(x, a - 1) * math.exp(-b * x) / math.gamma(a);
        }

        //updateBounds according to the graph
        function updateBounds() {
            let yVals = [];
            graphs.forEach(graph => {
                //skip those are deleted
                if (trashCan.includes(graphs.indexOf(graph))) {
                    return;
                }
                graph.d.forEach(d => {
                    yVals.push(d[1]);
                })

                lowerBound = Math.min(...yVals);
                upperBound = Math.max(...yVals);
                maxY = (upperBound * 1.1) / 100;
            })
        }

        function updateFormula(distribution, index) {
            let formula = "";
            switch (distribution) {
                case 'normal':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\mu, \\sigma) = \\frac{1}{\\sqrt{2\pi} \\sigma} e^{-\\frac{(x - \\mu)^2}{2\\sigma^2}} \\end{gather} </span>\`;
                    break;
                case 'uniform':
                    formula = String.raw\`<span> \\begin{gather} f(x; a, b) = \\frac{1}{b - a} \\end{gather} </span>\`;
                    break;
                case 'exponential':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\lambda) = \\lambda e^{-\\lambda x} \\end{gather} </span>\`;
                    break;
                case 'chiSquared':
                    formula = String.raw\`<span> \\begin{gather} f(x; k) = \\frac{1}{2^{k/2} \\Gamma(k/2)} x^{k/2 - 1} e^{-x/2} \\end{gather} </span>\`;
                    break;
                case 'studentT':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\nu) = \\frac{\\Gamma((\\nu + 1)/2)}{\\Gamma(\\nu/2) \\sqrt{\\nu \\pi}} (1 + \\frac{x^2}{\\nu})^{-\\frac{\\nu + 1}{2}} \\end{gather} </span>\`;
                    break;
                case 'snedecorF':
                    formula = String.raw\`<span> \\begin{gather} f(x; d_1, d_2) = \\frac{\\Gamma(\\frac{d_1 + d_2}{2}) (\\frac{d_1}{d_2})^{d_1/2} x^{d_1/2 - 1}}{\\Gamma(\\frac{d_1}{2}) \\Gamma(\\frac{d_2}{2}) (1 + \\frac{d_1}{d_2} x)^{\\frac{d_1 + d_2}{2}}} \\end{gather} </span>\`;
                    break;
                case 'binomial':
                    formula = String.raw\`<span> \\begin{gather} f(x; n, p) = \\binom{n}{x} p^x (1 - p)^{n - x} \\end{gather} </span>\`;
                    break;
                case 'beta':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\alpha, \\beta) = \\frac{x^{\\alpha - 1} (1 - x)^{\\beta - 1}}{B(\\alpha, \\beta)} \\end{gather} </span>\`;
                    break;
                case 'gamma':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\alpha, \\beta) = \\frac{\\beta^\\alpha x^{\\alpha - 1} e^{-\\beta x}}{\\Gamma(\\alpha)} \\end{gather} </span>\`;
                    break;
                case 'bernoulli':
                    formula = String.raw\`<span> \\begin{gather} f(x; p) = p^x (1 - p)^{1 - x} \\end{gather} </span>\`;
                    break;
                case 'geometric':
                    formula = String.raw\`<span> \\begin{gather} f(x; p) = (1 - p)^{x - 1} p \\end{gather} </span>\`;
                    break;
                case 'poisson':
                    formula = String.raw\`<span> \\begin{gather} f(x; \\lambda) = \\frac{e^{-\\lambda} \\lambda^x}{x!} \\end{gather} </span>\`;
                    break;
                case 'negativeBinomial':
                    formula = String.raw\`<span> \\begin{gather} f(x; r, p) = \\binom{x + r - 1}{x} p^r (1 - p)^x \\end{gather} </span>\`;
                    break;
                case 'hypergeometric':
                    formula = String.raw\`<span> \\begin{gather} f(x; N, K, n) = \\frac{\\binom{K}{x} \\binom{N - K}{n - x}}{\\binom{N}{n}} \\end{gather} </span>\`;
                    break;
                default:
                    formula = "No formula available.";
                    break;
            }
            document.getElementById('formula' + index).innerHTML = formula;
        }

        function drawGraph(graph) {
            color = graph.color;
            const numPoints = svgWidth;
            const standardFactor = 100;
            const dataPoints = [];
            let tem = [0, 0];
            //empty the d array
            graph.d = [];
            let prev = 0;

            //define the range of available x for different discrete distribution
            if(graph.distribution == 'binomial'){
                graph.range = graph.alpha;
            } else if(graph.distribution == 'bernoulli'){
                graph.range = 1;
            } else if(graph.distribution == 'geometric'){
                graph.range = maxX;
            } else if(graph.distribution == 'poisson'){
                graph.range = maxX;
            } else if(graph.distribution == 'negativeBinomial'){
                graph.range = maxX;
            } else if(graph.distribution == 'hypergeometric'){
                graph.range = maxX;
            }

            for (let i = 0; i <= numPoints; i++) {
                x = minX + (i / numPoints) * (maxX - minX);


                let y = 0;
                if (graph.distribution == 'beta') {
                    y = betaPDF(x, graph.alpha, graph.beta)
                } else if (graph.distribution == 'gamma') {
                    y = gammaPDF(x, graph.alpha, graph.beta)
                } else if (graph.distribution == 'normal') {
                    y = normalPDF(x, graph.alpha, graph.beta)
                } else if (graph.distribution == 'uniform') {
                    y = uniformPDF(x, graph.alpha, graph.beta)
                } else if (graph.distribution == 'exponential') {
                    y = exponentialPDF(x, graph.alpha)
                } else if (graph.distribution == 'chiSquared') {
                    y = chiSquaredPDF(x, graph.alpha)
                } else if (graph.distribution == 'studentT') {
                    y = studentTPDF(x, graph.alpha)
                } else if (graph.distribution == 'snedecorF') {
                    y = snedecorFPDF(x, graph.alpha, graph.beta)
                } else if (graph.discrete) {
                    //wanna take more accurate integer value -> 0, 1.000001, 2.000002, 3.000003, 4.000004 instead of now 0,2,4,6,8
                    if ((x >= prev + 1 || x == 0) && x <= graph.range + 1) {
                        prev = Math.floor(x);
                        if (graph.distribution == 'binomial') {
                            y = binomialPDF(x, graph.alpha, graph.beta)
                        } else if (graph.distribution == 'bernoulli') {
                            y = bernoulliPDF(x, graph.alpha)
                            if(x > 1){
                                break;
                            }
                        } else if (graph.distribution == 'geometric') {
                            y = geometricPDF(x, graph.alpha)
                        } else if (graph.distribution == 'poisson') {
                            y = poissonPDF(x, graph.alpha)
                        } else if (graph.distribution == 'negativeBinomial') {
                            //x value should start from r
                            if(x < graph.alpha){
                                y = 0;
                            } else {
                            y = negativeBinomialPDF(x, graph.alpha, graph.beta)
                            }
                        } else if (graph.distribution == 'hypergeometric') {
                            //make sure the x value is start from correct point
                            if(x < math.max(0, graph.gamma + graph.beta - graph.alpha) || x > math.min(graph.beta, graph.gamma)){
                            
                                y = 0;
                            } else {
                                
                            y = hypergeometricPDF(Math.floor(x), graph.alpha, graph.beta, graph.gamma)
                            }
                        }

                    } else {
                        continue;
                    }
                }
                y = y * standardFactor;

                //check if reach the boundary of the graph
                if (i >= svgWidth) {
                    //add the last point to the dataPoints
                    tem = [i, svgHeight];
                    break;
                }
                if (!isNaN(y)) {
                    tem = [i, y];
                    dataPoints.push(tem);
                    graph.d.push(tem);
                }
            }

            //filter out all the Infinity values
            graph.d = graph.d.map(d => {
                if (d[1] == Infinity) {
                    d[1] = 0;
                }
                return d;
            })

            let fakeDataPoints = [];
            let scaleFactor = 1 / maxX;
            if (graph.distribution == 'normal') {
                //create the case for 0 to 1
                let entry = [0, 0];
                for (let i = 0; i <= numPoints; i++) {
                    x = (i / numPoints)
                    let y = normalPDF(x, graph.alpha * scaleFactor, graph.beta)
                    y = y * standardFactor;
                    if (i >= svgWidth) {
                        //add the last point to the dataPoints
                        entry = [i, svgHeight];
                        break;
                    }
                    if (!isNaN(y)) {
                        entry = [i, y];
                        fakeDataPoints.push(entry);
                    }
                }
            }


            //line generate
            // Y value will be flipped and adjust by the maxY
            const line = d3.line()
                .x(d => d[0])
                .y(d => (svgHeight - d[1] * (svgHeight / (maxY * 100))));

            let outputData = [];
            for (let i = 0; i < dataPoints.length; i++) {
                outputData.push([dataPoints[i][0], dataPoints[i][1] * (svgHeight / (maxY * 100))]);
            }

            //if the graph is binomial then remove duplicate y values
            if (graph.discrete) {
                for (let i = 0; i < outputData.length; i++) {
                    //convert y value to correct coordinate system
                    outputData[i][1] = svgHeight - outputData[i][1];
                    //convert x value to correct coordinate system
                }

            }
            updateFormula(graph.distribution, graphs.indexOf(graph));
            if (graph.discrete) {
                svg.selectAll('circle')
                    .data(outputData, d => \`\${d[0]}-\${d[1]}\`)
                    .enter()
                    .append('circle')
                    .attr('cx', d => d[0])
                    .attr('cy', d => d[1])
                    .attr('r', 5)
                    .attr('fill', color);
            } else {
                svg.append('path')
                    .datum(dataPoints)
                    .attr('fill', 'none')
                    .attr('stroke', color)
                    .attr('stroke-width', 1.5)
                    .attr('d', line);
            }

            //calculate the cdf
            if (graph.distribution == 'uniform') {
                graph.cdf = trapezoidalCDF([graph.alpha, graph.beta], [1 / (graph.beta - graph.alpha), 1 / (graph.beta - graph.alpha)]);
            } else if (graph.distribution == 'normal') {
                graph.cdf = trapezoidalCDF(fakeDataPoints.map(d => d[0]), fakeDataPoints.map(d => d[1]));
            } else {
                graph.cdf = trapezoidalCDF(graph.d.map(d => d[0]), graph.d.map(d => d[1]));
            }

            //calculate the quantile position
            if (graph.init) {
                if (graph.distribution == 'uniform') {
                    graph.xPosition = quantileUniform(graph.alpha, graph.beta, graph.quantile);
                } else if (graph.distribution == 'normal') {
                    graph.xPosition = trapezoidalQuantile(graph.quantile, fakeDataPoints.map(d => d[0]), graph.cdf);
                    graph.xPosition = graph.xPosition * maxX;
                } else {
                    graph.xPosition = trapezoidalQuantile(graph.quantile, graph.d.map(d => d[0]), graph.cdf);
                }
                graph.init = false;
            }

            //check if it reach the boundary of the graph
            if (graph.xPosition >= maxX) {
                graph.xPosition = maxX - maxX * 0.1;
            }
            let percent = (graph.xPosition - minX) / (maxX - minX);
            //for drawing
            quantilePosition = percent * numPoints;

            //write the output calculated quantile value
            document.getElementById(\`output\${graphs.indexOf(graph)}\`).value = graph.xPosition.toFixed(2);

            //prepare the data for the quantile line by changing the d array
            const quantileData = [];
            //add the bottom starting point
            quantileData.push([0, 0]);
            for (let i = 0; i < dataPoints.length; i++) {
                // check if it reach the boundary of the graph
                if (i >= quantilePosition) {
                    //down to the bottom
                    quantileData.push([dataPoints[i][0], 0]);
                    break;
                }
                quantileData.push(dataPoints[i]);
            }

            //add the line to svg
            if (graph.showShadedArea) {
                svg.append('path')
                    .datum(quantileData)
                    .attr('fill', color)
                    .attr('stroke', color)
                    .attr('stroke-width', 1.5)
                    .attr('d', line);
            }

        }


        //trapezoidalCDF
        function trapezoidalCDF(x, pdf) {
            const n = pdf.length;
            const cdf = new Array(n).fill(0);
            cdf[0] = 0;
            //width of each trapezoid

            for (let i = 1; i < n; i++) {
                const width = x[i] - x[i - 1];
                cdf[i] = cdf[i - 1] + 0.5 * (pdf[i - 1] + pdf[i]) * width;
            }
            return cdf;
        }

        // Function to safely call MathJax typeset
        function safeMathJaxTypeset() {
            if (window.MathJax && MathJax.typesetPromise) {
                MathJax.typesetPromise().then(() => {
                    console.log('MathJax typeset complete.');
                }).catch(err => console.error('MathJax typesetting error:', err));
            } else {
                console.log('MathJax not loaded yet.');
            }
        }

        //trapezoidalQuantile
        function trapezoidalQuantile(quantile, x, cdf) {
            const n = x.length;
            for (let i = 0; i < n; i++) {
                if (cdf[i] >= quantile * cdf[n - 1]) {
                    return i / (n - 1);
                }
            }
            return i / (n - 1);
        }

        //reverseTrapezoidalQuantile
        function reverseTrapezoidalQuantile(x, cdf) {
            const n = 1190;
            let compute_quantile = 0;
            compute_quantile = cdf[Math.floor(x * (n - 1))] / cdf[n - 1];
            return compute_quantile;
        }

        //quantile function for find corresponding x position of normal distribution by using inverse error function
        function quantileNormal(p, mean, stdDev) {

            const erfInv = (x) => {
                const a = 8 * (Math.PI - 3) / (3 * Math.PI * (4 - Math.PI));
                const y = Math.log(1 - Math.pow(x, 2));
                const z = 2 / (Math.PI * a) + y / 2;
                const w = Math.sqrt(z * z - y / a);
                const m = w - z;
                const sign = m < 0 ? -1 : 1;
                const result = Math.sqrt(sign * m * Math.sqrt((m * m) - y / a) - m);
                return result;
            }

            return mean + stdDev * Math.sqrt(2) * erfInv(1 - 2 * p);
        }



        function updateChart() {


            //clear the svg before adding anything
            svg.selectAll('*').remove();

            //domain setting
            xs.domain([minX, maxX])
            ys.domain([0, maxY]);

            //create axises
            //x axis
            svg.append('g')
                .attr('transform', \`translate(0, \${svgHeight})\`)
                .call(d3.axisBottom(xs));

            //y axis
            svg.append('g')
                .call(d3.axisLeft(ys));

            //clear legend container
            legendContainer.innerHTML = '';
            //loop through the graphs
            graphs.forEach(graph => {
                //change background color for each set of control panel according to the lengend
                // document.getElementById(\`controlPanel\${graphs.indexOf(graph)}\`).style.backgroundColor = graph.color;
                //check if it is in trash can if so then skip
                if (trashCan.includes(graphs.indexOf(graph))) {
                    return;
                }
                drawGraph(graph)
            })
            safeMathJaxTypeset();

        }

        //download graphs as png
        canvasDownload.addEventListener('click', e => {
            let svg = document.querySelector('svg');
            let blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
            let url = URL.createObjectURL(blob);
            e.target.href = url;
        })

        document.getElementById('minX').addEventListener('change', function () {
            //check if the value is less than maxX
            if (parseFloat(this.value) >= maxX) {
                this.value = minX;
            }
            minX = parseFloat(this.value);
            graphs.forEach(graph => {
                graph.init = true;
            })
            updateChart();
        })

        document.getElementById('maxX').addEventListener('change', function () {
            maxX = parseFloat(this.value);
            graphs.forEach(graph => {
                graph.init = true;
            })
            updateChart();
        })

        document.getElementById('maxY').addEventListener('change', function () {
            maxY = parseFloat(this.value);
            graphs.forEach(graph => {
                graph.init = true;
            })
            updateChart();
        })

        document.getElementById('update').addEventListener('click', function () {
            updateBounds();
            updateChart();
            document.getElementById('maxY').value = maxY;
        })

        document.getElementById('addGraphButton').addEventListener('click', addGraph);
        updateChart();
    </script>

</body>

</html>
`;
        //make it downloadable
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
    };
    return (
        <button onClick={generateHtml}>Generate HTML</button>
    );
}

export default HtmlGenerator;