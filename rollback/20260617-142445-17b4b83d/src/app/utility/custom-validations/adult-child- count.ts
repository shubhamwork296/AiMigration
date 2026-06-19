
export function adultChildSetters( selectedRailcard: string, currentRailcardCount: number, railCards:any) {
    let railcard = railCards.find(item => {
        if (item.Code === selectedRailcard) {
          return true;
        }
      });
      if(railcard != undefined){
          if(railcard.IsAdultChildShow){
              return null;
          }
          else{
            let adult = railcard.MinAdult * currentRailcardCount, child = railcard.MinChild * currentRailcardCount;
            return [adult, child]; 
          }
      }
  
    }


