import React, { use, useState, useEffect } from 'react';
import DistributionSelector from './components/DistributionSelector';
import HtmlGenerator from './components/HtmlGenerator';
import RegressionSelector from './components/RegressionSelector';
import ModeSelector from './components/ModeSelector';


function App() {
    const [selectedDistribution, setSelectedDistribution] = useState(['uniform', 'normal', 'poisson']);
    const [selectedMode, setSelectedMode] = useState('Distribution Playground');
    const [selectedFeature, setSelectedFeature] = useState(['uniform', 'normal', 'poisson']);

    useEffect(() => {
        console.log(selectedMode);
    }, [selectedMode]);
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to Web Math Playground HTML Generator</h1>
            </header>
            <main>
                <ModeSelector setSelectedMode={setSelectedMode} />
                <RegressionSelector
q                    selectedMode={selectedMode}
                    selectedFeature={selectedFeature}
                    setSelectedFeature={setSelectedFeature}
                />

                <HtmlGenerator
                    selectedFeature={selectedFeature}
                    mode={selectedMode}
                />
            </main>
        </div>
    );
}

export default App;