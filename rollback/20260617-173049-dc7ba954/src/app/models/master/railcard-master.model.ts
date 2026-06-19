
export class RailCardMasterData {
  Name: string;
  MaxAdult: number;
  MinAdult: number;
  MaxChild: number;
  MinChild: number;
 }

 export class RailCardList
 {
  getRailCardList(): Array<RailCardMasterData>{
    let railCardsList: RailCardMasterData[];

    let railcard1 = new RailCardMasterData();
    railcard1.Name = '16-25 Saver';
    railcard1.MaxAdult = 1;
    railcard1.MinAdult = 1;
    railcard1.MaxChild = 0;
    railcard1.MinChild = 0;
    railCardsList.push(railcard1);

    let railcard2 = new RailCardMasterData();
    railcard2.Name = '26-30 Saver';
    railcard2.MaxAdult = 1;
    railcard2.MinAdult = 1;
    railcard2.MaxChild = 0;
    railcard2.MinChild = 0;
    railCardsList.push(railcard2);


    let railcard3 = new RailCardMasterData();
    railcard3.Name = 'Annual Gold Card';
    railcard3.MaxAdult = 4;
    railcard3.MinAdult = 1;
    railcard3.MaxChild = 4;
    railcard3.MinChild = 0;
    railCardsList.push(railcard3);


    let railcard4 = new RailCardMasterData();
    railcard4.Name = 'Disabled Child Railcard';
    railcard4.MaxAdult = 1;
    railcard4.MinAdult = 0;
    railcard4.MaxChild = 1;
    railcard4.MinChild = 1;
    railCardsList.push(railcard4);

    let railcard5 = new RailCardMasterData();
    railcard5.Name = 'Disabled Person Railcard';
    railcard5.MaxAdult = 2;
    railcard5.MinAdult = 1;
    railcard5.MaxChild = 1;
    railcard5.MinChild = 0;
    railCardsList.push(railcard5);


    let railcard6 = new RailCardMasterData();
    railcard6.Name = 'Family & Friends Railcard';
    railcard6.MaxAdult = 4;
    railcard6.MinAdult = 1;
    railcard6.MaxChild = 4;
    railcard6.MinChild = 1;
    railCardsList.push(railcard6);

    let railcard7 = new RailCardMasterData();
    railcard7.Name = 'HM forces Railcard';
    railcard7.MaxAdult = 1;
    railcard7.MinAdult = 1;
    railcard7.MaxChild = 0;
    railcard7.MinChild = 0;
    railCardsList.push(railcard7);

    let railcard8 = new RailCardMasterData();
    railcard8.Name = 'Job centre Plus Travel Discount';
    railcard8.MaxAdult = 1;
    railcard8.MinAdult = 1;
    railcard8.MaxChild = 0;
    railcard8.MinChild = 0;
    railCardsList.push(railcard8);

    let railcard9 = new RailCardMasterData();
    railcard9.Name = 'Network Railcard';
    railcard9.MaxAdult = 1;
    railcard9.MinAdult = 1;
    railcard9.MaxChild = 0;
    railcard9.MinChild = 0;
    railCardsList.push(railcard9);

    let railcard10 = new RailCardMasterData();
    railcard10.Name = 'Senior Railcard';
    railcard10.MaxAdult = 1;
    railcard10.MinAdult = 1;
    railcard10.MaxChild = 0;
    railcard10.MinChild = 0;
    railCardsList.push(railcard10);

    let railcard11 = new RailCardMasterData();
    railcard11.Name = 'Two Together Railcard';
    railcard11.MaxAdult = 2;
    railcard11.MinAdult = 2;
    railcard11.MaxChild = 0;
    railcard11.MinChild = 0;
    railCardsList.push(railcard11);

    let railcard12 = new RailCardMasterData();
    railcard12.Name = 'Young Scot National Entitlement Card';
    railcard12.MaxAdult = 1;
    railcard12.MinAdult = 0;
    railcard12.MaxChild = 1;
    railcard12.MinChild = 0;
    railCardsList.push(railcard12);

     return railCardsList;
  }

   onRailCardCountChange()
   {
     let noOfAdults = 1;
     let noOfChildren = 0;
     let selectedRailcardCount = 1;
     let selectedRailcardName = "16-25 Saver";
     let railcardsList = this.getRailCardList();

     if((noOfAdults + noOfChildren) > 1 && selectedRailcardCount > 1 && selectedRailcardName != ""
      && railcardsList.length > 0  )
     {
       railcardsList.forEach(m=>m.Name == selectedRailcardName);
     }

   }

 }


