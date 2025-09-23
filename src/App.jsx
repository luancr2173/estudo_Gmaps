import './App.css';
import Map from './mapcontent/map';
import MapDrawer from './vdoBar/drawer';

function App() {
  return (

    <div className='App'>

      <style>{`
        iframe {
          width: 100%;
        }
          fontWeigth: bold;
        p{
         
        }
      `}</style>

      <MapDrawer>

        <p>camadas</p>
        <iframe src="https://www.youtube.com/embed/DCt5U-noe30?si=fmGI32ukdKZTalau" title="YouTube video player"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

        <p>Draw</p>
        <iframe  src="https://www.youtube.com/embed/e565lqqn61c?si=PpfAaLEvSKfHP2Br" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        
        <p>teste</p>
        <iframe src="https://www.youtube.com/embed/DCt5U-noe30?si=fmGI32ukdKZTalau" title="YouTube video player"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        
        <p>camadas</p>
        <iframe src="https://www.youtube.com/embed/DCt5U-noe30?si=fmGI32ukdKZTalau" title="YouTube video player"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        
        <p>camadas</p>
        <iframe src="https://www.youtube.com/embed/M4yrU2Tl4O4?si=H7okB71g1SuCNpS6" title="YouTube video player"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
      
      </MapDrawer>

      <Map/>

    </div>

  );
}

export default App;
