import './App.css';
import Routing from './routes/Routing';
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas);

function App() {
  return (
    <Routing />
  );
}

export default App;

