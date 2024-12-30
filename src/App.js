import React, {useState} from 'react';
import DistributionSelector from './components/DistributionSelector';
import HtmlGenerator from './components/HtmlGenerator';

function App() {
    const [selectedDistribution, setSelectedDistribution] = useState(['uniform', 'normal', 'poisson']);
    return (
        <div className="App">
            <header className="App-header">
                <h1>Welcome to Web Math Playground HTML Generator</h1>
            </header>
            <main>
                <DistributionSelector
                selectedDistribution={selectedDistribution}
                setSelectedDistribution={setSelectedDistribution}
                />
                <HtmlGenerator selectedDistribution={selectedDistribution} />       
            </main>
        </div>
    );
}

export default App;