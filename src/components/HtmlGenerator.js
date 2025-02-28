import React from 'react';

const HtmlGenerator = ({ selectedFeature, mode }) => {
    var html = ""
    const generateHtml = () => {
        html = `
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
            //controlPanel.appendChild(quantileLabel);
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
            //controlPanel.appendChild(quantileSlider);
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
            //controlPanel.appendChild(quantileNumber);

            //checkbox for shaded area
            const shadedAreaCheckbox = document.createElement('input');
            shadedAreaCheckbox.type = 'checkbox';
            shadedAreaCheckbox.id = \`shadedArea\${graphs.indexOf(graph)}\`;
            shadedAreaCheckbox.addEventListener('change', function () {
                graph.showShadedArea = this.checked;
                updateChart();
            })
            //controlPanel.appendChild(shadedAreaCheckbox);

            //label for x location output
            const quantileOutputLabel = document.createElement('label');
            quantileOutputLabel.textContent = 'x: ';
            //controlPanel.appendChild(quantileOutputLabel);


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
            //controlPanel.appendChild(quantileOutput);
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
            selectedFeature.map(d => `'${d}'`).join(', ')
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
            //document.getElementById(\`output\${graphs.indexOf(graph)}\`).value = graph.xPosition.toFixed(2);

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
        if (mode !== "Distribution Playground") {
            html = `<!DOCTYPE html>

<html>
<head>
	<title>Linear Regression (stat version)</title>
</head>
<style>
.slider
{
    width: 350px;
}
.AccuracyTextField
{
    width: 20px;
}
</style>
<body>
	
    <canvas id="canvas" width="440" height="480" style="border:1px solid black;">
    </canvas>
	<br>
    <div class="slidecontainer" id="scaleXDiv">
        X axis scale:
        <input type="range" min="0" max="30" value="17" class="slider" id="scaleX">
    </div>
    <div class="slidecontainer" id="scaleYDiv">
        Y axis scale:
        <input type="range" min="0" max="30" value="17" class="slider" id="scaleY">
    </div>
    <div class="slidecontainer" id="radiusDiv">
        <label>Point size:&nbsp;&nbsp;&nbsp;</label> 
        <input type="range" min="1" max="100" value="25" class="slider" id="radius">
    </div>

    <div id="heightDiv">
        <label>Image height: </label>
        <input type="text" id="canvasHeight" value="440" size="8" oninput="handleCanvasHeight();">
    </div>
    
    <div id="widthDiv">
        <label>Image width: </label>
        <input type="text" id="canvasWidth" value="440" size="8" oninput="handleCanvasWidth();">    
    </div>
    
    <button onclick="handleAutoScales();" id="autoScales">Auto scales</button>

	
    <table style="border: 1px black solid; border-collapse: collapse;" id="TableStatistics">
		<thead>
			<tr>
				<th style="border: 1px black solid;" width="100px"><button id="showOnGraph">Show on graph</button></th>
				<th style="border: 1px black solid;" width="100px">Predicted value</th>
                <th style="border: 1px black solid;" width="100px">Standard error</th>
                <th style="border: 1px black solid;" width="400px">100(1-&alpha;)% Confidence interval/ Prediction interval
                    <br>(&alpha;: <input type="text" id="alpha" size="8" value="0.05">)
                </th>
                <th></th>
			</tr>
            
		</thead>
		<tbody>
            <tr style="border: 1px black solid;">
                <td style="border: 1px black solid;">&beta;<sub>0</sub></td>
                <td id="beta0" style="border: 1px black solid;"></td>
                <td id="se0" style="border: 1px black solid;"></td>
                <td id="CI0" style="border: 1px black solid;"></td>
            </tr>
            <tr style="border: 1px black solid;">
                <td style="border: 1px black solid;">&beta;<sub>1</sub></td>
                <td id="beta1" style="border: 1px black solid;"></td>
                <td id="se1" style="border: 1px black solid;"></td>
                <td id="CI1" style="border: 1px black solid;"></td>
            </tr>
            <tr style="border: 1px black solid;">
                <td style="border: 1px black solid;">y when x = <input type="text" size="8" id="x0"></td>
                <td id="predictionX0" style="border: 1px black solid;"></td>
                <td id="seMeanX0" style="border: 1px black solid;"></td>
                <td id="meanPI" style="border: 1px black solid;"></td>
            </tr>
            <tr style="border: 1px black solid;">
                <td style="border: 1px black solid;">&nbsp;</td>
                <td style="border: 1px black solid;"></td>
                <td id="seIndividualX0" style="border: 1px black solid;"></td>
                <td id="individualPI" style="border: 1px black solid;"></td>
            </tr>
		</tbody>
	</table>

    <p id="Formula" ></p>
    <p id="rho" ></p>
    <label id="rRhoAccuracy">
        R squared/&rho; accuracy: round off to 
        <input type="text" id="RSquaredAccuracy" value="2" class="AccuracyTextField" oninput="handleRSquaredAccuracy()"> 
        d.p(max: 10)
    </label>
    <br>
    <label id="equationAccuracy">
        Equation accuracy: round off to 
        <input type="text" id="equationAccuracy" value="2" class="AccuracyTextField" oninput="handleEquationAccuracy()"> 
        d.p(max: 10)
    </label>
    <br>
    <div id="showFormulaDiv">
        <input type="checkbox" id="showFormulaOnCanvas" name="showFormulaOnCanvas" checked/>
        <label >show formula</label>
    </div>
    <div id="howMoveOriginDiv">
        <label >Move the graph by dragging </label>
        <select name="moveGraphMethod" id="moveGraphMethod">
            <option value="origin">the origin</option>
            <option value="nowhere">nowhere</option>
            <option value="anywhere">anywhere</option>
        </select>
    </div>
	<input type="button" value="Reset" onclick="reset()" id="resetButton">
    <br><br>
    <div id="importDiv">
        <label >Import spreadsheet:</label>
        <button  onclick="document.getElementById('fileSelect').click()">Select a file</button>
        <input id="fileSelect" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style="display:none"/>
    </div>
    <div id="downloadDiv">
        <label >File name:</label>
        <input type="text" name="downloadName" id="downloadName" size="15">
        <button id="download" onclick="handleDownload();">Download xlsx file</button>
    </div>
    
    <div id="defaultDatasetDiv">
        <label >Import default dataset:</label>
        <select name="defaultDataset" id="defaultDataset">
            <option value="1">Dataset1</option>
            <option value="2">Dataset2</option>
            <option value="3">Dataset3</option>
            <option value="4">Dataset4</option>
        </select>
        <Input id="defaultDatasetButton" type ="button" value="Confirm" onclick="importDefaultDataset()">
    </div>
    <br>
    <input type="button" value="Reverse X Y" id="reverseXY">
    <input type="button" value="Recover" id="recover" onclick="handleRecover();">
	<table style="border: 1px black solid; border-collapse: collapse;" id="tablePoints">
		<thead>
			<tr>
				<th style="border: 1px black solid;" width="100px"><input type="text" id="xLabel" value="X" oninput="handleXLabelInput();"></th>
				<th style="border: 1px black solid;" width="100px"><input type="text" id="yLabel" value="Y" oninput="handleYLabelInput();"></th>
                <th></th>
			</tr>
		</thead>
		<tbody id="TableBodyofCoordinates">
		</tbody>
	</table>
    <div id="userGuide">
	<p >User guide:
		<ul>
		<li>Click on empty space to add new data point.</li>
		<li>Drag data point to change its position.</li>
		<li>Click on a data point to delete it.</li>
        <li>Drag the origin to change its position.</li>
        <li>Drag the sliders to change the scales.</li>
		</ul></p></div>

    <script src="https://cdn.jsdelivr.net/alasql/0.3/alasql.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.7.12/xlsx.core.min.js"></script>
    <script lang="javascript" src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.15.2/xlsx.full.min.js"></script>
    <script lang="javascript" src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js"></script>

    <script src= "https://cdnjs.cloudflare.com/ajax/libs/jstat/1.7.1/jstat.min.js"> </script>  

	<script>
		function getRandomInt(max) {
			return Math.floor(Math.random() * max);
		}

		function Roundto2decimal(num) {
			return Math.round(num * 100) / 100;
		}

        function roundTo5Decimal(num){
            return Math.round(num * 100000) / 100000;
        }

        function roundTo7Decimal(num){
            return Math.round(num * 10000000) / 10000000;
        }

        const canvas = document.getElementById("canvas")
        let ctx = canvas.getContext("2d");
        let mouseIsDown = false;
        let lastX = 0;
        let lastY = 0;
        let circles = [];
        let SumX = 0;
        let SumY = 0;
        let SumXsquare = 0;
        let SumYsquare = 0;
        let SumXY = 0;
        let tempX = 0;
        let tempY = 0;
        let beta0 = null;
        let beta1 = null;
        let R = 0;
        let Rsquare = 0;
        let selectedCircleIndex = -1; //-1: nothing, -2: origin (move whole graph), -3: formula
        let removeFlag = false;
        let radius = 5;

        let textFont = "20px sans-serif";
        ctx.font = textFont;
        //origin position on canvas
        let originX = 100; 
        let originY = 380;
        let axisIncrement = 80;
        let barStartX = 30;
        let yAxisTextDistance = 3;
        let xAxisTextDistance = 20;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        let RsquareBarColorStyle = "gradual"; //"constant", "dichotomous", "gradual" for all the style
        let scaleFactorX = 5;
        let scaleFactorY = 5;
        let inputtedX = null;
        let inputtedY = null;
        let inputtedXFocus = false;
        let inputtedYFocus = false;

        let sliderX = document.getElementById("scaleX");
        let sliderY = document.getElementById("scaleY");
        let RsquaredAccuracy = 2;
        let RsquaredAccuracyTextField = document.getElementById("RSquaredAccuracy");
        let equationAccuracy = 2;
        let equationAccuracyTextField = document.getElementById("equationAccuracy");

        let allVertical = false;
        let allHorizontal = false;

        let fileSelect = document.getElementById("fileSelect");
        let fileContents = null;

        let defaultDatasetInput = document.getElementById("defaultDataset");
        let moveGraphMethodInput = document.getElementById("moveGraphMethod");
        let moveGraphOffsetX = 0;
        let moveGraphOffsetY = 0;
        let reverseXYButton = document.getElementById("reverseXY");

        let showFormulaOnCanvasInput = document.getElementById("showFormulaOnCanvas");

        let mouseOnTopCircleIndex = -1;

        let canvasWidth = 440;
        let canvasHeight = 440;
        let xLabel = "X";
        let yLabel = "Y";
        let xLabelInput = document.getElementById("xLabel");
        let yLabelInput = document.getElementById("yLabel");
        let removedCircles = [];

        let showMeanPIsOnCanvas = false;

        let selected = [${//print out the selected distribution
                selectedFeature.map(d => `'${d}'`).join(', ')
                }]
        const defaultDatasets ={
            "1": [
            [
              "10",
              "8.04"
            ],
            [
              "8",
              "6.95"
            ],
            [
              "13",
              "7.58"
            ],
            [
              "9",
              "8.81"
            ],
            [
              "11",
              "8.33"
            ],
            [
              "14",
              "9.96"
            ],
            [
              "6",
              "7.24"
            ],
            [
              "4",
              "4.26"
            ],
            [
              "12",
              "10.84"
            ],
            [
              "7",
              "4.82"
            ],
            [
              "5",
              "5.68"
            ]
            ],

            "2": [
            [
              "10",
              "9.14"
            ],
            [
              "8",
              "8.14"
            ],
            [
              "13",
              "8.74"
            ],
            [
              "9",
              "8.77"
            ],
            [
              "11",
              "9.26"
            ],
            [
              "14",
              "8.1"
            ],
            [
              "6",
              "6.13"
            ],
            [
              "4",
              "3.1"
            ],
            [
              "12",
              "9.13"
            ],
            [
              "7",
              "7.26"
            ],
            [
              "5",
              "4.74"
            ]
            ],

            "3": [
            [
              "10",
              "7.46"
            ],
            [
              "8",
              "6.77"
            ],
            [
              "13",
              "12.74"
            ],
            [
              "9",
              "7.11"
            ],
            [
              "11",
              "7.81"
            ],
            [
              "14",
              "8.84"
            ],
            [
              "6",
              "6.08"
            ],
            [
              "4",
              "5.39"
            ],
            [
              "12",
              "8.15"
            ],
            [
              "7",
              "6.42"
            ],
            [
              "5",
              "5.73"
            ]
            ],

            "4": [
            [
              "8",
              "6.58"
            ],
            [
              "8",
              "5.76"
            ],
            [
              "8",
              "7.71"
            ],
            [
              "8",
              "8.84"
            ],
            [
              "8",
              "8.47"
            ],
            [
              "8",
              "7.04"
            ],
            [
              "8",
              "5.25"
            ],
            [
              "19",
              "12.5"
            ],
            [
              "8",
              "5.56"
            ],
            [
              "8",
              "7.91"
            ],
            [
              "8",
              "6.89"
            ]
            ]
        }

        //formula of the linear regression. Shown on the canvas. Handle its position and movement.
        let formulaOnCanvas = {
            startX: 0,
            startY: 40,
            isShown: true,
            width: 0,
            height: 30,
            formula: "",
            offsetX: 0, 
            offsetY: 0,
            
            update: function(){
                console.log("formula on canvas update called", this.startX, this.startY, this.width, this.height);
                ctx.beginPath();
                ctx.fillStyle = "#AAB7B8";
                ctx.fillRect(this.startX, this.startY, this.width, this.height);
                ctx.fillStyle = "black";
                ctx.textAlign = "left";
                ctx.fillText(this.formula, this.startX, this.startY + this.height / 2);
                ctx.textAlign = "center";
            },

            contain: function(lastX, lastY){
                if (lastX < this.startX || lastX > this.startX + this.width){
                    return false;
                }
                if (lastY < this.startY || lastY > this.startY + this.height){
                    return false;
                }
                return true;
            },

            updateOffsets: function (lastX, lastY){
                console.log("formulaOnCanvas updateOffsets called");
                formulaOnCanvas.offsetX = lastX - this.startX;
                formulaOnCanvas.offsetY = lastY - this.startY;
            },

            move: function(lastX, lastY){
                console.log("formulaOnCanvas move called");
                formulaOnCanvas.startX = lastX - this.offsetX;
                formulaOnCanvas.startY = lastY - this.offsetY;
                updateDrawing();
            }
        };

        //draw x and y axes with labels
        function drawAxes(){
            if (insideCanvas(originX, originY)){
                drawAxesWithOrigin();
            }
            else {
                drawAxesWithoutOrigin();
            }
        }

        //draw x and y axes with labels (not including origin)
        function drawAxesWithoutOrigin(){
            ctx.strokeStyle = "gray";
            //y axis
            ctx.beginPath();
            ctx.moveTo(30, 40);
            ctx.lineTo(30, 40 + canvasHeight);
            ctx.stroke();
            //x axis
            ctx.beginPath();
            ctx.moveTo(0, canvasHeight + 10);
            ctx.lineTo(canvasWidth, canvasHeight + 10 );
            ctx.stroke();
            ctx.strokeStyle = "black";

            //y axis text
            ctx.textAlign = "left";

            let smallestNumberOnYAxis = Math.ceil(canvasToRegressionY(canvasHeight - 35) / scaleFactorY) * scaleFactorY;
            let canvasStartY = regressionToCanvasY(smallestNumberOnYAxis);

            for (let i = 0; i < canvasHeight / axisIncrement; i++){
                if (!insideCanvas(30 + yAxisTextDistance, canvasStartY - axisIncrement * (i+1))){
                    ctx.fillStyle = "gray";
                    ctx.fillText(yLabel, 30 + yAxisTextDistance, canvasStartY - axisIncrement * i);
                    ctx.fillStyle = "black";
                    break;
                }
                ctx.fillText(roundTo5Decimal((smallestNumberOnYAxis + scaleFactorY * i)).toString(), 30 + yAxisTextDistance, canvasStartY - axisIncrement * i);
            }
            ctx.textAlign = "center";

            //x axis text
            let smallestNumberOnXAxis = Math.ceil(canvasToRegressionX(50) / scaleFactorX) * scaleFactorX;
            let canvasStartX = regressionToCanvasX(smallestNumberOnXAxis);

            for (let i = 0; i < canvasWidth/ axisIncrement; i++){
                if (!insideCanvas(canvasStartX + axisIncrement * (i+1), canvasHeight + 10 - xAxisTextDistance)){
                    ctx.fillStyle = "gray";
                    ctx.fillText(xLabel, canvasStartX + axisIncrement * i, canvasHeight + 10 - xAxisTextDistance);
                    ctx.fillStyle = "black";
                    break;
                }
                ctx.fillText(roundTo5Decimal((smallestNumberOnXAxis + scaleFactorX * i)).toString(), canvasStartX + axisIncrement * i, canvasHeight + 10 - xAxisTextDistance);
            }
        }

        //draw x and y axes with labels (including origin)
        function drawAxesWithOrigin(){
            //y axis text
            if (originX >= 100){
                ctx.textAlign = "right";
                let biggestIInCanvas = 5;
                for(let i = 1; true; i++){
                    if (!insideCanvas(originX - yAxisTextDistance, originY - axisIncrement * i)){
                        biggestIInCanvas = i - 1;
                        break;
                    }
                }
                for (let i = 1; i < biggestIInCanvas; i++){
                    ctx.fillText(roundTo5Decimal((scaleFactorY * i)).toString(), originX - yAxisTextDistance, originY - axisIncrement * i);
                }
                if (biggestIInCanvas != 0){
                    ctx.fillStyle = "gray";
                    ctx.fillText(yLabel, originX - yAxisTextDistance, originY - axisIncrement * biggestIInCanvas);
                    ctx.fillStyle = "black";
                }
                
                for (let i = -1; true; i--){
                    if (!insideCanvas(originX - yAxisTextDistance, originY - axisIncrement * i)){
                        break;
                    }
                    ctx.fillText(roundTo5Decimal((scaleFactorY * i)).toString(), originX - yAxisTextDistance, originY - axisIncrement * i);
                }
                ctx.textAlign = "center";
            }
            else {
                ctx.textAlign = "left";
                let biggestIInCanvas = 5;
                for (let i = 1; true; i++){
                    if (!insideCanvas(originX + yAxisTextDistance, originY - axisIncrement * i)){
                        biggestIInCanvas = i - 1;
                        break;
                    }
                }
                for (let i = 1; i < biggestIInCanvas; i++){
                    ctx.fillText(roundTo5Decimal((scaleFactorY * i)).toString(), originX + yAxisTextDistance, originY - axisIncrement * i);
                }
                if (biggestIInCanvas != 0){
                    ctx.fillStyle = "gray";
                    ctx.fillText(yLabel, originX + yAxisTextDistance, originY - axisIncrement * biggestIInCanvas);
                    ctx.fillStyle = "black";
                }
                for (let i = -1; true; i--){
                    if (!insideCanvas(originX + yAxisTextDistance, originY - axisIncrement * i)){
                        break;
                    }
                    ctx.fillText(roundTo5Decimal((scaleFactorY * i)).toString(), originX + yAxisTextDistance, originY - axisIncrement * i);
                }
                ctx.textAlign = "center";
            }
            //x axis text
            if (originY <= canvasHeight + 10){
                let biggestIInCanvas = 5;
                for (let i = 1; true; i++){
                    if (!insideCanvas(originX + axisIncrement * i, originY + xAxisTextDistance)){
                        biggestIInCanvas = i - 1;
                        break;
                    }
                }
                for (let i = 1; i < biggestIInCanvas; i++){
                    ctx.fillText(roundTo5Decimal((scaleFactorX * i)).toString(), originX + axisIncrement * i, originY + xAxisTextDistance);
                }
                if (biggestIInCanvas != 0){
                    ctx.fillStyle = "gray";
                    ctx.fillText(xLabel, originX + axisIncrement * biggestIInCanvas, originY + xAxisTextDistance);
                    ctx.fillStyle = "black";
                }
                

                for (let i = -1; true; i--){
                    if (!insideCanvas(originX + axisIncrement * i, originY + xAxisTextDistance)){
                        break;
                    }
                    ctx.fillText(roundTo5Decimal((scaleFactorX * i)).toString(), originX + axisIncrement * i, originY + xAxisTextDistance);
                }
            }
            else{
                let biggestIInCanvas = 5;
                for (let i = 1; true; i++){
                    if (!insideCanvas(originX + axisIncrement * i, originY - xAxisTextDistance)){
                        biggestIInCanvas = i - 1;
                        break;
                    }
                }

                for (let i = 1; i < biggestIInCanvas; i++){
                    ctx.fillText(roundTo5Decimal((scaleFactorX * i)).toString(), originX + axisIncrement * i, originY - xAxisTextDistance);
                }
                if (biggestIInCanvas != 0){
                    ctx.fillStyle = "gray";
                    ctx.fillText(xLabel, originX + axisIncrement * biggestIInCanvas, originY - xAxisTextDistance);
                    ctx.fillStyle = "black";
                }
                
                for (let i = -1; true; i--){
                    if (!insideCanvas(originX + axisIncrement * i, originY - xAxisTextDistance)){
                        break;
                    }
                    ctx.fillText(roundTo5Decimal((scaleFactorX * i)).toString(), originX + axisIncrement * i, originY - xAxisTextDistance);
                }
            }
            // origin text
            if (originX >= 30 && originY <= 450){
                ctx.fillText("0", originX - xAxisTextDistance, originY + xAxisTextDistance);
            }
            else if (originX < 30 && originY <= 450){
                ctx.fillText("0", originX + xAxisTextDistance, originY + xAxisTextDistance);
            }
            else if (originX >= 30){ // && originY > 450
                ctx.fillText("0", originX - xAxisTextDistance, originY - xAxisTextDistance);
            }
            else {
                ctx.fillText("0", originX + xAxisTextDistance, originY - xAxisTextDistance);
            }
            
            ctx.strokeStyle = "gray";
            //y axis
            ctx.beginPath();
            ctx.moveTo(originX, 40);
            ctx.lineTo(originX, 40 + canvasHeight);
            ctx.stroke();
            //x axis
            ctx.beginPath();
            ctx.moveTo(0, originY);
            ctx.lineTo(canvasWidth, originY);
            ctx.stroke();
            ctx.strokeStyle = "black";
        }

        drawAxes();

        //transform canvas x coordinate (drawing position) to regression x coordinate (real data)
        function canvasToRegressionX(canvasX){
            return (canvasX - originX) / axisIncrement * scaleFactorX;
        }

        //transform canvas y coordinate (drawing position) to regression y coordinate (real data)
        function canvasToRegressionY(canvasY){
            return (canvasY - originY) / -axisIncrement * scaleFactorY;
        }

        //transform canvas coordinates (drawing position) to regression coordinates (real data)
        function canvasToRegreesionCoordinates(canvasX,canvasY){
            return{
                x: canvasToRegressionX(canvasX),
                y: canvasToRegressionY(canvasY)
            }
        }

        //transform regression x coordinate (real data) to canvas x coordinate (drawing position)
        function regressionToCanvasX(regressionX){
            return regressionX / scaleFactorX * axisIncrement + originX;
        }

        //transform regression y coordinate (real data) to canvas y coordinate (drawing position)
        function regressionToCanvasY(regressionY){
            return regressionY / scaleFactorY * -axisIncrement + originY;
        }
        
        //draw the straight fitted line
        function drawFittedLine(){
            if (circles.length <= 1){
                return;
            }
            if (allVertical){
                ctx.beginPath()
                ctx.moveTo(regressionToCanvasX(circles[0].x), 0);
                ctx.lineTo(regressionToCanvasX(circles[0].x), 40 + canvasHeight);
                ctx.stroke();
                return;
            }
            if (allHorizontal){
                ctx.beginPath()
                ctx.moveTo(0, regressionToCanvasY(circles[0].y));
                ctx.lineTo(canvasWidth, regressionToCanvasY(circles[0].y));
                ctx.stroke();
                return;
            }            
            let startX = canvasToRegressionX(0);
            let endX = canvasToRegressionX(canvasWidth);
            let startY = startX * beta1 + beta0;
            let endY = endX * beta1 + beta0;
            let canvasStartY = regressionToCanvasY(startY);
            let canvasEndY = regressionToCanvasY(endY);
            ctx.beginPath();
            ctx.moveTo(0, canvasStartY);
            ctx.lineTo(canvasWidth, canvasEndY);
            ctx.stroke();
        }

        //draw the bar on the top of the canvas. The bar shows the R squared value.
        function drawRSquaredBar(){
            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, originX, 40);
            ctx.fillStyle = "gray";
            ctx.fillRect(barStartX, 0, canvasWidth - barStartX, 40);
            
            if(RsquareBarColorStyle == "constant"){
                ctx.fillStyle = "blue";
            }
            else if (RsquareBarColorStyle == "dichotomous"){
                if (Rsquare < 0.5){
                    ctx.fillStyle = "green";
                }
                else{
                    ctx.fillStyle = "red";
                }
            }
            else if (RsquareBarColorStyle == "gradual"){
                ctx.fillStyle = "rgb(" + (Rsquare * 125).toFixed(0) + " " + (125 - Rsquare * 125).toFixed(0) + " 0/100%)";
            }
            ctx.fillRect(barStartX, 0, (canvasWidth - barStartX) * Rsquare, 40);
            ctx.fillStyle = "black";
            ctx.fillText("R", barStartX / 2, 20);
            ctx.font = "12px sans-serif";
            ctx.fillText("2", barStartX * 0.85, 12);
            ctx.font = "20px sans-serif";
            ctx.fillStyle = "white";

            if (allHorizontal){
                ctx.textAlign = "left";
                ctx.fillText("undefined", barStartX + 5, 20);
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                return;
            }

            if (allVertical){
                Rsquare = 0;
            }

            let startX = 0;
            if(Rsquare <= 0.5){
                startX = Rsquare * (canvasWidth - barStartX) + 5;
                ctx.textAlign = "left";
            }
            else{
                startX = Rsquare * (canvasWidth - barStartX) - 5;
                ctx.textAlign = "right";
            }
            ctx.fillText(Rsquare.toFixed(RsquaredAccuracy), barStartX + startX, 20);
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
        }
        drawRSquaredBar();

        //return the formula of the regression
        function getFormula(){
            console.log("getFormula called");
            //Formula
            if (circles.length == 0){
                return "";
            }
            else if(circles.length == 1 || allHorizontal){//show y = constant
                console.log("all horizontal", beta0, beta1);
                return "y = " + (circles[0].y).toFixed(equationAccuracy);
            }
			else if (Math.abs(beta1 - 0) <= 0.0000000001) { //show y = constant
                console.log("all horizontal", beta0, beta1);
				return "y = " + (beta0).toFixed(equationAccuracy);
			} 
            else if (allVertical){
                return "x = " + (circles[0].x).toFixed(equationAccuracy);
            }
            else if (beta1 >= 0){
				return "y = " + beta0.toFixed(equationAccuracy) + " + " + beta1.toFixed(equationAccuracy) + "x";
			} 
            else {
                return "y = " + beta0.toFixed(equationAccuracy) + " - " + (-beta1).toFixed(equationAccuracy) + "x";
            }
        }

        //Show formula in html
        function printFormula(){
            document.getElementById("Formula").innerHTML = getFormula();
        }
        printFormula();

        //show rho value in html
        function printRho(){
            if (circles.length == 0){
                return;
            }
            if (allVertical || allHorizontal){
                document.getElementById("rho").innerHTML = "&rho; is undefined.";
                return;
            }
            document.getElementById("rho").innerHTML = "&rho; = " + R.toFixed(RsquaredAccuracy);
        }
        printRho();

        //show formula on canvas
        function printFormulaOnCanvas(){
            if (!formulaOnCanvas.isShown){
                return;
            }
            formulaOnCanvas.formula = getFormula();
            formulaOnCanvas.width = ctx.measureText(formulaOnCanvas.formula).width;
            formulaOnCanvas.update();
        }

        //Get Cursor Position
        function getMousePosition(evt) {
            let rect = canvas.getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        };

        //A class of a data point.
        class Circle{
            static radius = radius;

            constructor(x, y){
                this.x = x;
                this.y = y;
            }
            draw(){
                ctx.beginPath();
                ctx.arc(regressionToCanvasX(this.x), regressionToCanvasY(this.y), Circle.radius, 0, 2*Math.PI);
                ctx.fill();
                ctx.stroke();
            }
            //return whether a point is contained in the circle
            contain(mouseX, mouseY){
                return (Math.hypot(regressionToCanvasX(this.x) - mouseX, regressionToCanvasY(this.y) - mouseY) < Circle.radius);
            }
            //change the x y values.
            setXY(tempX, tempY, isChangedFromTable){
                if (isNaN(tempX) || isNaN(tempY)){
                    console.log("setXY, NaN input");
                    return;
                }
                let originalX = this.x;
                let originalY = this.y;
                
                SumX += tempX - originalX;
                SumY += tempY - originalY;
                SumXsquare += tempX * tempX - originalX * originalX;
                SumYsquare += tempY * tempY - originalY * originalY;
                SumXY += tempX * tempY - originalX * originalY;
                beta1 = (SumXY - SumX * SumY / circles.length) / (SumXsquare - SumX * SumX / circles.length);
                beta0 = SumY / circles.length - beta1 * SumX / circles.length;
                R = (circles.length * SumXY - SumX * SumY) / Math.sqrt((circles.length * SumXsquare - SumX * SumX) * (circles.length * SumYsquare - SumY * SumY));
                Rsquare = R * R;
                this.x = tempX;
                this.y = tempY;
                if (isChangedFromTable){
                    updateDrawingWithoutTable();
                    return;
                }
                updateDrawing();
                updateTableStatistics();
            }
            setX(tempX, isChangedFromTable){
                console.log("setX called");
                this.setXY(tempX, this.y, isChangedFromTable);
            }
            setY(tempY, isChangedFromTable){
                console.log("setY called");
                this.setXY(this.x, tempY, isChangedFromTable);
            }
        }

        //update the table showing all the data
        function updateTable() {
            console.log("update table called ", inputtedXFocus, inputtedYFocus);
			//Create Table
			const TableBodyofCoords = document.getElementById("TableBodyofCoordinates");

			TableBodyofCoords.innerHTML = "";

			for (let i = circles.length; i >= 0 ; i--) {
                
				const row = document.createElement("tr");

				// Create three cells in each row
				for (let j = 1; j <= 3; j++) {
					const cell = row.insertCell();
                    let input = document.createElement('input');
                    input.setAttribute('type', 'textbox');
                    if (i == mouseOnTopCircleIndex){
                        //input.setAttribute('color', 'red');
                        input.style.color = "red";
                    }
                    //input.style.width = '50px';
                    //Empty value: For new input
                    if (i == circles.length && j == 1){
                        cell.style.border = "1px gray solid";
                        if (inputtedX == null){
                            input.value = "";
                        }
                        else{
                            input.value = inputtedX;
                        }
					    

                        function HandleInputtedX(tempX){
                            
                            if (isNaN(tempX)){
                                return;
                            }
                            inputtedX = parseFloat(tempX);
                        }
                        input.addEventListener("input", () => {HandleInputtedX(input.value);}, false);
                        cell.appendChild(input);
                        continue;
                    }
                    else if (i == circles.length && j == 2){
                        cell.style.border = "1px gray solid";
                        if (inputtedY == null){
                            input.value = "";
                        }
                        else{
                            input.value = inputtedY;
                        }
					    

                        function HandleInputtedY(tempY){
                            
                            if (isNaN(tempY)){
                                return;
                            }
                            inputtedY = parseFloat(tempY);
                        }
                        input.addEventListener("input", () => {HandleInputtedY(input.value);}, false);
                        cell.appendChild(input);
                        continue;
                    }
                    else if (i == circles.length && j == 3){
                        let buttonAdd = document.createElement("button");
                        buttonAdd.innerHTML = "Add";
                        function handleAddInputtedCircle(evt){
                            tempX = (inputtedX != null) ? inputtedX : 0;
                            tempY = (inputtedY != null) ? inputtedY : 0;
                            inputtedX = null;
                            inputtedY = null;
                            addCircle(tempX, tempY);
                        }
                        buttonAdd.addEventListener("click", handleAddInputtedCircle, false);
                        cell.appendChild(buttonAdd);
                        buttonAdd.setAttribute("id", "TableAddButton"+i.toString());
                    }
					else if (j == 1) {
						input.value = roundTo7Decimal(circles[i].x);
                        input.addEventListener("input", () => {circles[i].setX(parseFloat(input.value), true); input.focus();}, false);
                        input.addEventListener("focus", () => {mouseOnTopCircleIndex = i; input.style.color = "red";updateCanvas();}, false);
                        input.addEventListener("blur", () => {mouseOnTopCircleIndex = -1; input.style.color = "black";updateCanvas();}, false);
                        cell.appendChild(input);
					}
					else if (j == 2) {
						input.value = roundTo7Decimal(circles[i].y);
                        input.addEventListener("input", () => {circles[i].setY(parseFloat(input.value), true); input.focus();}, false);
                        input.addEventListener("focus", () => {mouseOnTopCircleIndex = i; input.style.color = "red";updateCanvas();}, false);
                        input.addEventListener("blur", () => {mouseOnTopCircleIndex = -1; input.style.color = "black";updateCanvas();}, false);
                        cell.appendChild(input);
					}
                    else if (j == 3){
                        let buttonDelete = document.createElement("button");
                        buttonDelete.innerHTML = "Remove";
                        buttonDelete.addEventListener("click", () => {removeCircle(i);}, false);
                        cell.appendChild(buttonDelete);
                        buttonDelete.setAttribute("id", "TableDeleteButton"+i.toString());
                    }
					cell.style.border = "1px black solid";
				}

				TableBodyofCoords.appendChild(row);
			}
        console.log(document.activeElement);
		}
        updateTable();
        
        //Input: regression X Y
        //Add a new data point
        function addCircle(tempX,tempY){
            if (isNaN(tempX) || isNaN(tempY)){
                console.log("addCircle, NaN input", tempX, tempY);
                return;
            }
            let addedCircle = new Circle(tempX,tempY);
            circles.push(addedCircle);
            //console.log(tempX, tempY);
            SumX += tempX;
            SumY += tempY;
            SumXsquare += tempX * tempX;
            SumYsquare += tempY * tempY;
            SumXY += tempX * tempY;
            console.log("add pre beta ", beta0, beta1);
            beta1 = (SumXY - SumX * SumY / circles.length) / (SumXsquare - SumX * SumX / circles.length);
            console.log("分母", (SumXsquare - SumX * SumX / circles.length));
			beta0 = SumY / circles.length - beta1 * SumX / circles.length;
			R = (circles.length * SumXY - SumX * SumY) / Math.sqrt((circles.length * SumXsquare - SumX * SumX) * (circles.length * SumYsquare - SumY * SumY));
			Rsquare = R * R;
            console.log("add",tempX, tempY, SumX, SumY, SumXsquare, SumYsquare, SumXY,beta0, beta1, circles.length);
            updateDrawing();
            updateTableStatistics();
        }

        //Remove a data point with a given index
        function removeCircle(index){ //index in circles
            removedCircle = circles.splice(index, 1)[0];
            removedCircles.push(removedCircle);
            let tempX = removedCircle.x;
            let tempY = removedCircle.y;
            console.log("removed circle:", tempX, tempY);
            SumX -= tempX;
            SumY -= tempY;
            SumXsquare -= tempX * tempX;
            SumYsquare -= tempY * tempY;
            SumXY -= tempX * tempY;
            if (circles.length > 0){
                beta1 = (SumXY - SumX * SumY / circles.length) / (SumXsquare - SumX * SumX / circles.length);
                beta0 = SumY / circles.length - beta1 * SumX / circles.length;
                R = (circles.length * SumXY - SumX * SumY) / Math.sqrt((circles.length * SumXsquare - SumX * SumX) * (circles.length * SumYsquare - SumY * SumY));
                Rsquare = R * R;
            }
            updateDrawing();
            console.log("remove",SumX, SumY, SumXsquare, SumYsquare, SumXY, beta0, beta1);
            updateTableStatistics();
        }
        
        //check if the data forms a straight line
        function checkSpecialCases(){
            checkAllVertical();
            checkAllHorizontal();
        }

        //check if the data forms a vertical line
        function checkAllVertical(){
            console.log("checkAllVertical Called");
            for (let i = 1; i < circles.length; i++){
                if (circles[i].x != circles[0].x){
                    allVertical = false;
                    return;
                }
            }
            allVertical = true;
            console.log("all Vertical");
        }

        //check if the data forms a horizontal line
        function checkAllHorizontal(){
            console.log("checkAllHorizontal Called");
            for (let i = 1; i < circles.length; i++){
                if (circles[i].y != circles[0].y){
                    allHorizontal = false;
                    return;
                }
            }
            allHorizontal = true;
            console.log("all horizontal");
        }

        //update everything
        function updateDrawing(){
            checkSpecialCases();
            updateCanvas();
            printFormula();
            printRho();
            updateTable();
        }
    
        //update everything except the table showing all data 
        function updateDrawingWithoutTable(){
            checkSpecialCases();
            updateCanvas();
            printFormula();
            printRho();
        }

        //update content on the canvas.
        function updateCanvas(){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var i = 0; i < circles.length; i++) {
                let circle = circles[i];
                circle.draw();
            }
            if (mouseOnTopCircleIndex < circles.length && mouseOnTopCircleIndex >= 0){
                let circle = circles[mouseOnTopCircleIndex];
                ctx.fillStyle = "red";
                circle.draw();
                ctx.fillStyle = "black";
            }
            drawAxes();
            drawFittedLine();
            printFormulaOnCanvas();
            if(showMeanPIsOnCanvas){
                plotMeanPIs();
            }
            drawRSquaredBar();
        }

        //handle mousedown event on canvas
        function handleMouseDown(e) {
            console.log(e.detail, moveGraphMethodInput.value);
            /*
            if (e.detail !== 1){
                return;
            }*/
            let isRightMB;
            e = e || window.event;

            if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                isRightMB = e.which == 3; 
            else if ("button" in e)  // IE, Opera 
                isRightMB = e.button == 2; 

            if(isRightMB){
                return;
            }

            let position = getMousePosition(e);
            lastX = position.x;
            lastY = position.y;
            let tempXY = canvasToRegreesionCoordinates(lastX, lastY);
            let tempX = tempXY.x;
            let tempY = tempXY.y;
            //console.log(lastX, lastY, tempX, tempY);
            mouseIsDown = true;
            let inACircle = false;
            if (formulaOnCanvas.contain(lastX, lastY)){
                formulaOnCanvas.updateOffsets(lastX, lastY);
                selectedCircleIndex = -3;
                removeFlag = false;
                return;
            }
            if (moveGraphMethodInput.value == "origin" && Math.hypot(originX - lastX, originY - lastY) < Circle.radius * 2 / 3){
                selectedCircleIndex = -2; // indicating the origin
                removeFlag = false;
                moveGraphOffsetX = 0;
                moveGraphOffsetY = 0;
                return;
            }
            else if (moveGraphMethodInput.value == "anywhere"){
                selectedCircleIndex = -2; // indicating the origin
                removeFlag = false;
                moveGraphOffsetX = lastX - originX;
                moveGraphOffsetY = lastY - originY;
                return;
            }
            for (let i = 0; i < circles.length; i++){
                if (circles[i].contain(lastX, lastY)){
                    inACircle = true;
                    selectedCircleIndex = i;
                    removeFlag = true;
                    break;
                }
            }
            if (!inACircle && lastY > 40){
                addCircle(tempX, tempY);
                selectedCircleIndex = -1;
                removeFlag = false;
            }
        }
        canvas.addEventListener('mousedown', handleMouseDown, false);

        //handle mouse up event on canvas.
        function handleMouseUp(e) {
            let position = getMousePosition(e);
            mouseX = position.x;
            mouseY = position.y;
        
            // mouseup stuff here
            mouseIsDown = false;
            if (removeFlag){
                removeCircle(selectedCircleIndex);
            }
        }
        canvas.addEventListener('mouseup', handleMouseUp, false);

        //handle mousemove event on canvas
        function handleMouseMove(e){
            console.log("move is called");
            let position = getMousePosition(e);
            lastX = position.x;
            lastY = position.y;
            removeFlag = false;
            mouseOnTopCircleIndex = -1;
            for (let i = 0; i < circles.length; i++){
                if (circles[i].contain(lastX, lastY)){
                    mouseOnTopCircleIndex = i;
                    break;
                }
            }
            if (selectedCircleIndex == -1 || !mouseIsDown){
                updateDrawing();
                return;
            }
            if (selectedCircleIndex == -2){ // moving origin
                if (false && !insideCanvas(lastX - moveGraphOffsetX, lastY - moveGraphOffsetY)){
                    console.log(lastX - moveGraphOffsetX,lastY - moveGraphOffsetY);
                    return;
                }
                originX = lastX - moveGraphOffsetX;
                originY = lastY - moveGraphOffsetY;
                updateDrawing();
                return;
            }
            if (selectedCircleIndex == -3){
                formulaOnCanvas.move(lastX, lastY);
                return;
            }
            tempX = canvasToRegressionX(lastX);
            tempY = canvasToRegressionY(lastY);
            circles[selectedCircleIndex].setXY(tempX, tempY, false);
            updateDrawing();
        }
        canvas.addEventListener('mousemove', handleMouseMove, false);

        //handle mouseout event on canvas
        function handleMouseOut(event){
            mouseOnTopCircleIndex = -1;
            selectedCircleIndex = -1;
            mouseIsDown = false;
        }
        canvas.addEventListener("mouseout", handleMouseOut, false);

        //reset all parameters/variables
        function reset(){
            circles.splice(0,circles.length);
            SumX = 0;
            SumY = 0;
            SumXsquare = 0;
            SumYsquare = 0;
            SumXY = 0;
            tempX = 0;
            tempY = 0;
            beta0 = null;
            beta1 = null;
            R = 0;
            Rsquare = 0;
            selectedCircleIndex = -1;
            removeFlag = false;
            inputtedX = null;
            inputtedY = null;
            inputtedXFocus = false;
            inputtedYFocus = false;
            scaleFactorX = 5;
            scaleFactorY = 5;
            axisIncrement = 80;
            originX = 100;
            originY = 380;
            sliderX.value = 17;
            sliderY.value = 17;
            RsquaredAccuracy = 2;
            RsquaredAccuracyTextField.value = 2;
            equationAccuracy = 2;
            equationAccuracyTextField.value = 2;
            allVertical = false;
            allHorizontal = false;
            formulaOnCanvas.startX = 0
            formulaOnCanvas.startY = 40;
            formulaOnCanvas.isShown = true;
            formulaOnCanvas.width = 0;
            formulaOnCanvas.height = 30;
            formulaOnCanvas.formula = "";
            formulaOnCanvas.offsetX = 0;
            formulaOnCanvas.offsetY = 0;
            defaultDatasetInput.value = "1";
            moveGraphMethodInput.value = "origin";
            moveGraphOffsetX = 0;
            moveGraphOffsetY = 0;
            mouseOnTopCircleIndex = -1;
            document.getElementById("downloadName").value = "";
            xLabel = "X";
            yLabel = "Y";
            xLabelInput.value = "X";
            yLabelInput.value = "Y";
            document.getElementById("canvasWidth").value = "440";
            document.getElementById("canvasHeight").value = "440";
            canvas.width = "440";
            canvas.height = "480";
            canvasWidth = 440;
            canvasHeight = 440;
            ctx.font = textFont;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            removedCircles.splice(0, removedCircles.length);
            updateDrawing();
        }

        //transform slider input value to scale
        function sliderValueToScale(sliderValue){
            let bias = [1, 2, 5][sliderValue % 3]
            let significance = Math.floor(sliderValue / 3) - 5;
            return roundTo5Decimal(bias * Math.pow(10, significance));
        }

        //transform scale slider input value
        function scaleToSliderValue(scale){
            let significance = Math.floor(Math.log10(scale));
            let bias = parseInt(scale / Math.pow(10, significance));
            if (bias != 1 && bias != 2 && bias != 5){
                throw "scaleToSliderValue bias error. Significance: " + significance + ". Bias: " + bias +".";
            }
            biasCorrespondingValues = {
                1: 0,
                2: 1,
                5: 2,
            }
            let sliderValue = (significance + 5) * 3 + biasCorrespondingValues[bias];
            return sliderValue;
        }

        sliderX.oninput = function() {
            scaleFactorX = sliderValueToScale(sliderX.value);
            updateDrawing();
        }
        sliderY.oninput = function() {
            scaleFactorY = sliderValueToScale(sliderY.value);
            updateDrawing();
        }

        //handle input of r squared accuracy
        function handleRSquaredAccuracy(){;
            //console.log("handleRSquaredAccuracy called")
            if (isNaN(RsquaredAccuracyTextField.value)){
                return;
            }
            let accuracy = parseFloat(RsquaredAccuracyTextField.value);
            if (!Number.isInteger(accuracy)){
                return;
            }
            if (accuracy < 0 || accuracy > 10){
                return;
            }
            RsquaredAccuracy = accuracy;
            drawRSquaredBar();
            printRho();
        }

        //handle equations' accuracy
        function handleEquationAccuracy(){
            //console.log("handleEquationAccuracy called")
            if (isNaN(equationAccuracyTextField.value)){
                return;
            }
            let accuracy = parseFloat(equationAccuracyTextField.value);
            if (!Number.isInteger(accuracy)){
                return;
            }
            if (accuracy < 0 || accuracy > 10){
                return;
            }
            equationAccuracy = accuracy;
            updateDrawing();
        }

        //handle select file button
        function handleFileSelect(evt){
            fileContents = null;
            let file = evt.target.files[0];
            handleExcel(file);
        }

        //handle excel file input
        function handleExcel(file){
            if (file) {
                let reader = new FileReader();
                reader.onload = e => {
                  let contents = processExcel(e.target.result);
                  fileContents = JSON.parse(contents);
                  console.log(contents);
                  console.log(typeof contents);
                  console.log(fileContents);
                  console.log(typeof fileContents);
                  console.log(Object.keys(fileContents));
                  handleFileContents();
                }
                reader.readAsBinaryString(file);
              } else {
                console.log("Failed to load file");
              }
        }

        //process excel file data
        function processExcel(data) {
            let workbook = XLSX.read(data, {
              type: 'binary'
            });
          
            let firstSheet = workbook.SheetNames[0];
            data = to_json(workbook);
            return data;
          };

        //convert data to json format
        function to_json(workbook) {
            let result = {};
            workbook.SheetNames.forEach(function(sheetName) {
                let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1
                });
                if (roa.length) result[sheetName] = roa;
            });
            return JSON.stringify(result, 2, 2);
        };
        fileSelect.addEventListener('change',handleFileSelect);

        //handle file contents
        function handleFileContents(){
            let reverseXYFlag = false;
            if (Object.keys(fileContents).length != 1){
                handleInvalidFile("\\nFile contains more than one sheets.");
                return;
            }
            let dataPoints = fileContents[Object.keys(fileContents)[0]];
            console.log(dataPoints);
            let invalidMessage = "";
            for (let i = 0; i < dataPoints.length; i++){
                if (i == 0 && isIn(dataPoints[i][0], ["x", "X"]) && isIn(dataPoints[i][1], ["y", "Y"])) {
                    continue;
                }
                if (i == 0 && isIn(dataPoints[i][0], ["y", "Y"]) && isIn(dataPoints[i][1], ["x", "X"])) {
                    reverseXYFlag = true;
                    continue;
                }
                if (dataPoints[i].length != 2){
                    invalidMessage += "\\nRow" + (i+1).toString() + " does not contain exactly two columns.";
                    //handleInvalidFile("");
                    //return;
                }
                else if (isNaN(dataPoints[i][0]) || isNaN(dataPoints[i][1])){
                    invalidMessage += "\\nRow" + (i+1).toString() + " does not contain numbers.";
                    //handleInvalidFile("");
                    //return;
                }
            }
            if (invalidMessage != ""){
                handleInvalidFile(invalidMessage);
                
            }
           
            handleDataset(dataPoints, reverseXYFlag);
        }

        //input: all data, reverseXYFlag = true iff in form of y,x
        //remove all previous points. include all new points.
        function handleDataset(dataPoints, reverseXYFlag){
            reset();
            for (let i = 0; i < dataPoints.length; i++){
                if (dataPoints[i].length != 2 || isNaN(dataPoints[i][0]) || isNaN(dataPoints[i][1])){
                    continue;
                }
                console.log(dataPoints[i][0], dataPoints[i][1]);
                if (reverseXYFlag){
                    addCircle(parseFloat(dataPoints[i][1]), parseFloat(dataPoints[i][0]));
                }
                else{
                    addCircle(parseFloat(dataPoints[i][0]), parseFloat(dataPoints[i][1]));
                }
            }
        }

        //alert for invalid file input
        function handleInvalidFile(additionalMessage){
            alert("Invalid file input!"+additionalMessage);
            return;
        }

        function importDefaultDataset(){
            handleDataset(defaultDatasets[defaultDatasetInput.value]);
        }

        function handleShowFormulaOnCanvasInput(event){
            if (showFormulaOnCanvasInput.checked){
                formulaOnCanvas.isShown = true;
            }
            else{
                formulaOnCanvas.isShown = false;
            }
            updateDrawing();
        }

        showFormulaOnCanvasInput.addEventListener("click", handleShowFormulaOnCanvasInput, false);

        //download xlsx file
        function handleDownload(){
            let data = [];
            for (let i = 0; i < circles.length; i++){
                data.push([circles[i].x,circles[i].y]);
            }
            const worksheet = XLSX.utils.json_to_sheet(data, {skipHeader: 1});
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "data");
            if (document.getElementById("downloadName").value != ""){
                XLSX.writeFile(workbook, document.getElementById("downloadName").value + ".xlsx", { compression: true });
            }
            else{
                XLSX.writeFile(workbook, "download.xlsx", { compression: true });
            }
            
        }

        // return if stringToCheck is in an array (allowedStrings)
        function isIn(stringToCheck, allowedStrings){
            for (let i = 0; i < allowedStrings.length; i++){
                if (stringToCheck == allowedStrings[i]){
                    return true;
                }
            }
            return false;
        }

        function handleReverseXY(event){
            for (let i = 0; i < circles.length; i++){
                let temp = circles[i].x;
                circles[i].x = circles[i].y;
                circles[i].y = temp;
            }
            recalculate();
            updateDrawing();
        }
        reverseXYButton.addEventListener("click", handleReverseXY, false);

        //calculate beta0, beta0, r squared again.
        function recalculate(){
            SumX = 0;
            SumY = 0;
            SumXsquare = 0;
            SumYsquare = 0;
            SumXY = 0;
            beta0 = null;
            beta1 = null;
            R = 0;
            Rsquare = 0;
            for (let i = 0; i < circles.length; i++){
                let x = circles[i].x;
                let y = circles[i].y;
                SumX += x;
                SumY += y;
                SumXsquare += x * x;
                SumYsquare += y * y;
                SumXY += x * y;
            }
            beta1 = (SumXY - SumX * SumY / circles.length) / (SumXsquare - SumX * SumX / circles.length);
			beta0 = SumY / circles.length - beta1 * SumX / circles.length;
			R = (circles.length * SumXY - SumX * SumY) / Math.sqrt((circles.length * SumXsquare - SumX * SumX) * (circles.length * SumYsquare - SumY * SumY));
			Rsquare = R * R;
        }

        //check if a point(x,y) can be drawn inside the canvas
        function insideCanvas(x, y){
            return (x >= 0 && x <= canvasWidth && y >= 40 && y <= canvasHeight + 40);
        }

        //check if the string input is a floating point number
        function confirmFloat(stringInput){
            if(isNaN(stringInput)){
                return false;
            }
            return true;
        }

        //check if the string input is a non-negative floating point number
        function confirmNonNegativeFloat(stringInput){
            if(!confirmFloat(stringInput)){
                return false;
            }
            if (parseFloat(stringInput) < 0){
                return false;
            }
            return true;
        }

        //check if the string input is an integer
        function confirmInteger(stringInput){
            if (!confirmFloat(stringInput)){
                return false;
            }
            floatInput = parseFloat(stringInput);
            if(!Number.isInteger(floatInput)){
                return false;
            }
            return true;
        }

        //check if the string input is an positive integer.
        function confirmPositiveInteger(stringInput){
            if(!confirmInteger(stringInput)){
                return false;
            }
            if (parseInt(stringInput) <= 0){
                return false;
            }
            return true;
        }

        //handle canvas height input
        function handleCanvasHeight(event){
            console.log("handleCanvasHeight called");
            let input = document.getElementById("canvasHeight").value;
            if (confirmNonNegativeFloat(input)){
                canvasHeight = parseFloat(input);
                canvas.height = (canvasHeight + 40).toString();
                console.log("handleCanvasHeight called in if");
            }
            console.log("handleCanvasHeight called end");
            ctx.font = textFont;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            updateDrawing();
        }

        //handle canvas width input
        function handleCanvasWidth(event){
            console.log("handleCanvasWidth called");
            let input = document.getElementById("canvasWidth").value;
            if (confirmNonNegativeFloat(input)){
                canvasWidth = parseFloat(input);
                canvas.width = input;
                console.log("handleCanvasWidth called in if");
            }
            console.log("handleCanvasWidth called end");
            ctx.font = textFont;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            updateDrawing();
        }

        //handle x label input
        function handleXLabelInput(event){
            xLabel = xLabelInput.value;
            updateCanvas();
        }

        //handle y label input
        function handleYLabelInput(event){
            yLabel = yLabelInput.value;
            updateCanvas();
        }

        //handle recover button
        function handleRecover(){
            if (removedCircles.length == 0){
                alert("No points can be recovered.");
            }
            recoveredCircle = removedCircles.pop();
            console.log(recoveredCircle);
            addCircle(recoveredCircle.x, recoveredCircle.y);
        }

        //Find suitable scale for all points
        function findAllSuitableScales(){
            //find max and min values
            let maxX = circles[0].x; 
            let maxY = circles[0].x;
            let minX = circles[0].y;
            let minY = circles[0].y;
            for (let i = 0; i < circles.length; i++){
                maxX = Math.max(maxX, circles[i].x);
                minX = Math.min(minX, circles[i].x);
                maxY = Math.max(maxY, circles[i].y);
                minY = Math.min(minY, circles[i].y);
            }

            scaleFactorX = findSuitableScaleFactor(maxX - minX, "X");
            scaleFactorY = findSuitableScaleFactor(maxY - minY, "Y");
            originX += canvas.width - 60 - regressionToCanvasX(maxX);
            originY += 100 - regressionToCanvasY(maxY);
            //sliderX.value = scaleToSliderValue(scaleFactorX);
            //sliderY.value = scaleToSliderValue(scaleFactorY);
            console.log(minX, maxX, minY, maxY);
        }

        //find suitable scale factor for a given length (length to be shown in the axis) and one axis
        function findSuitableScaleFactor(length, axis){ //axis = "X" / 0 or "Y" / 1
            let numOfInterval = 4;
            if (axis == "X" || axis == 0){
                numOfInterval = Math.floor(canvas.width / axisIncrement) - 1;
            }
            else if (axis == "Y" || axis == 1){
                numOfInterval = Math.floor((canvas.height - 40) / axisIncrement) - 1;
            }
            
            let p = Math.ceil(Math.log10(length / numOfInterval));
            if (length / numOfInterval > 5 * Math.pow(10, p - 1)){
                return Math.pow(10, p);
            }
            if (length / numOfInterval > 2 * Math.pow(10, p - 1)){
                return 5 * Math.pow(10, p - 1);
            }
            return 2 * Math.pow(10, p - 1);
        }

        function handleAutoScales(){
            console.log("Auto scales called");
            findAllSuitableScales();
            console.log(scaleFactorX, scaleFactorY);
            updateCanvas();
            console.log(scaleToSliderValue(scaleFactorX), scaleToSliderValue(scaleFactorY));
            sliderX.value = scaleToSliderValue(scaleFactorX);
            sliderY.value = scaleToSliderValue(scaleFactorY);
        }

        //hanlde input of slider changing the radius of the points
        document.getElementById("radius").oninput = function(){
            radius = parseFloat( document.getElementById("radius").value ) / 5;
            Circle.radius = radius;
            updateCanvas();
        }

        //Additional statistical part:
        function t(p, DOF) { 
            if (p < 0 || p > 1) { 
                console.log("Probability value (p) must be between 0 and 1."); 
            } 
  
            const result = jStat.studentt.inv(p, DOF); 
            return result; 
        }

        let accuracyCI = 7;
        let alpha = 0.05;

        //contruct a 1-alpha confidence interval for beta0 and beta1
        function findConfidenceInterval(alpha, MSE){
            if (circles.length <= 2){
                alert("Number of data points ≤ 2.")
                return;
            }
            if (MSE == null){
                MSE = getMSE();
            }
            let sigma = Math.sqrt(MSE);
            let SXX = (SumXsquare - SumX * SumX / circles.length);
            let seBeta0 = Math.sqrt(MSE * (1 / circles.length + Math.pow((SumX / circles.length), 2) / SXX));
            let seBeta1 = Math.sqrt(MSE / SXX);
            let tValue = Math.abs(t(alpha/2, circles.length - 2));
            let CI0 = "(" + (beta0 - seBeta0 * tValue).toFixed(accuracyCI) + "," + (beta0 + seBeta0 * tValue).toFixed(accuracyCI) + ")";
            let CI1 = "(" + (beta1 - seBeta1 * tValue).toFixed(accuracyCI) + "," + (beta1 + seBeta1 * tValue).toFixed(accuracyCI) + ")";
            console.log("CI", seBeta0, seBeta1, tValue);
            return [CI0, CI1, seBeta0, seBeta1];
        }
         
        function getMSE(){
            let SSE = 0;
            for (let i = 0; i < circles.length; i++){
                SSE += Math.pow((circles[i].y - (beta0 + circles[i].x * beta1)), 2);
            }
            let MSE = SSE / (circles.length - 2);
            return MSE;
        }

        //contruct a 1-alpha prediction interval for mean response of x0
        function predictionMean(alpha, x0, MSE=null){
            if (circles.length <= 2){
                alert("Number of data points ≤ 2.")
                return;
            }
            if (MSE == null){
                MSE = getMSE();
            }
            let SXX = (SumXsquare - SumX * SumX / circles.length);
            let se = Math.sqrt(MSE * (1 / circles.length + Math.pow((SumX / circles.length - x0), 2) / SXX));
            let tValue = Math.abs(t(alpha/2, circles.length - 2));
            let yPredicted = beta0 + beta1 * x0;
            let lower = yPredicted - tValue * se;
            let upper = yPredicted + tValue * se;
            return [lower, upper, yPredicted, se];
        }

        //contruct a 1-alpha prediction interval for individual response of x0
        function predictionIndividual(alpha, x0, MSE=null){
            if (circles.length <= 2){
                alert("Number of data points ≤ 2.")
                return;
            }
            if (MSE == null){
                MSE = getMSE();
            }
            let SXX = (SumXsquare - SumX * SumX / circles.length);
            let se = Math.sqrt(MSE * (1 / circles.length + Math.pow((SumX / circles.length - x0), 2) / SXX + 1));
            let tValue = Math.abs(t(alpha/2, circles.length - 2));
            let yPredicted = beta0 + beta1 * x0;
            let lower = yPredicted - tValue * se;
            let upper = yPredicted + tValue * se;
            console.log(SXX, MSE, tValue, SumX / circles.length, se);
            return [lower, upper, yPredicted, se];
            
        }

        //update the table with statistics stuff.
        function updateTableStatistics(){
            document.getElementById("beta0").innerHTML = beta0;
            document.getElementById("beta1").innerHTML = beta1;
            //Valid x0 input
            if (document.getElementById("x0").value != "" && document.getElementById("x0").value != null && confirmFloat(document.getElementById("x0").value) && circles.length >= 2){
                document.getElementById("predictionX0").innerHTML = beta0 + parseFloat(document.getElementById("x0").value) * beta1;
            }
            if (circles.length <= 2){
                document.getElementById("CI0").innerHTML = "";
                document.getElementById("CI1").innerHTML = "";
                document.getElementById("meanPI").innerHTML = "";
                document.getElementById("individualPI").innerHTML = "";
                document.getElementById("se0").innerHTML = "";
                document.getElementById("se1").innerHTML = "";
                document.getElementById("seMeanX0").innerHTML = "";
                document.getElementById("seIndividualX0").innerHTML = "";
                return;
            }
            let MSE = getMSE();
            CIs = findConfidenceInterval(alpha, MSE);
            document.getElementById("CI0").innerHTML = CIs[0];
            document.getElementById("CI1").innerHTML = CIs[1];
            document.getElementById("se0").innerHTML = CIs[2];
            document.getElementById("se1").innerHTML = CIs[3];
            //Invalid X0
            if (document.getElementById("x0").value == "" || document.getElementById("x0").value == null || !confirmFloat(document.getElementById("x0").value)){
                return;
            }
            let x0 = parseFloat(document.getElementById("x0").value);
            let meanPI = predictionMean(alpha, x0, MSE);
            let individualPI = predictionIndividual(alpha, x0, MSE);
            document.getElementById("meanPI").innerHTML = "(Mean) (" + meanPI[0] + "," + meanPI[1] + ")";
            document.getElementById("individualPI").innerHTML = "(Individual) (" + individualPI[0] + "," + individualPI[1] + ")";
            document.getElementById("seMeanX0").innerHTML = meanPI[3];
            document.getElementById("seIndividualX0").innerHTML = individualPI[3];
        }

        document.getElementById("alpha").oninput = function(){
            let input = document.getElementById("alpha").value;
            if (!confirmFloat(input)){
                return;
            }
            let inputFloat = parseFloat(input);
            if (inputFloat <= 0 || inputFloat >= 1){
                return;
            }
            alpha = inputFloat;
            updateTableStatistics();
        }

        document.getElementById("x0").oninput = function(){
            if (document.getElementById("x0").value == "" || document.getElementById("x0").value == null || !confirmFloat(document.getElementById("x0").value)){
                return;
            }
            let x0 = parseFloat(document.getElementById("x0").value);
            document.getElementById("predictionX0").innerHTML = beta0 + x0 * beta1;
            if (circles.length <= 2){
                return;
            }
            let MSE = getMSE();
            let meanPI = predictionMean(alpha, x0, MSE);
            let individualPI = predictionIndividual(alpha, x0, MSE);
            document.getElementById("meanPI").innerHTML = "(Mean) (" + meanPI[0] + "," + meanPI[1] + ")";
            document.getElementById("individualPI").innerHTML = "(Individual) (" + individualPI[0] + "," + individualPI[1] + ")";
            document.getElementById("seMeanX0").innerHTML = meanPI[3];
            document.getElementById("seIndividualX0").innerHTML = individualPI[3];
        }

        //show predition intervals of mean response on the graph.
        function plotMeanPIs(){
            let MSE = getMSE();
            let increment = 1;
            let previousPI = predictionMean(alpha, canvasToRegressionX(0), MSE);
            for(let i = increment; i <= canvas.width; i += increment){
                currentPI = predictionMean(alpha, canvasToRegressionX(i), MSE);
                ctx.beginPath();
                ctx.moveTo(i - increment, regressionToCanvasY(previousPI[0]));
                ctx.lineTo(i, regressionToCanvasY(currentPI[0]));
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i - increment, regressionToCanvasY(previousPI[1]));
                ctx.lineTo(i, regressionToCanvasY(currentPI[1]));
                ctx.stroke();
                previousPI = currentPI;
            }
        }

        //handle show on graph button (show mean prediction intervals)
        document.getElementById("showOnGraph").onclick = function(){
            showMeanPIsOnCanvas = !showMeanPIsOnCanvas;
            updateCanvas();
        }

        //list of objects that can be hidden
        let choosableList = [
        "scaleXDiv", //scale X axis
        "scaleYDiv", //scale Y axis
        "radiusDiv", //adjust point size
        "heightDiv", //adjust height
        "widthDiv", // adjust width
        "autoScales", //auto scale X and Y axes
        "TableStatistics", //table of predictions, standard errors, confidence intervals
        "Formula", //formula of the linear regression
        "rho", //rho
        "rRhoAccuracy", // change accuracy of r squared and rho
        "equationAccuracy", // change accuracy of beta 0, and beta 1
        "showFormulaDiv", // able to choose not to show the formula
        "howMoveOriginDiv", // choose how to move origin
        "resetButton", //reset
        "importDiv", //import csv/ xlsx
        "downloadDiv", //download xlsx
        "defaultDatasetDiv", //import default dataset
        "reverseXY", //reverse x and y
        "recover", //retrieve deleted points
        "tablePoints", //table showing the values of the points
        "userGuide", // user guide
        ]

        //corresponding to choosableList. indicate if these objects display.
        let choosableBooleans = [false]*100

        for(let i = 0; i < choosableList.length; i++){
            if (choosableList.length > choosableBooleans.length){
                console.log("Not enough boolean values");
                break;
            }
            handleDisplay(choosableList[i], choosableBooleans[i]);
        }


        //Handle whether display the object(choosable) by display
        //Input:
        //    choosable: target interface object
        //    display: Boolean. True iff target interface object has to be displayed.
        function handleDisplay(choosable, display){
            if(selected.includes(choosable)){
                display = true;
                console.log("display", choosable);
            }
            if (display){
                document.getElementById(choosable).style.display = "";
            }
            else{
                document.getElementById(choosable).style.display = "None";
            }
        }
        

	</script>
</body>
</html>`;


        }
        //make it downloadable
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
        navigator.clipboard.writeText(html);
        //prompt that u have already copied the html code
        alert("HTML code has been copied to your clipboard. You can paste it to your HTML file.");
    };


    return (
        <div>
            <button onClick={generateHtml}>Generate HTML</button>
        </div>
    );
}

export default HtmlGenerator;