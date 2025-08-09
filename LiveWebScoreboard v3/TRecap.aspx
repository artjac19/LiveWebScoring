<%@ Page Language="vb" AutoEventWireup="false" CodeBehind="TRecap.aspx.vb" Inherits="LiveWebScoreBoard.TRecap" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
 <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Skier Recap</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" />
    <link rel="stylesheet" href="Content/styles.css" />
    <!--   <script src="js/bootstrap.bundle.min.js"></script>  -->
    <style>

    </style>
</head>
<body>
    <form id="form1" runat="server">
        <div>
       
         <!-- Store user selections -->
        <asp:Panel ID="Panel_HF" runat="server" Visible="false">
            <asp:HiddenField ID="HF_SanctionID" runat="server" />
            <asp:HiddenField ID="HF_SkierID" runat="server" />
            <asp:HiddenField ID="HF_Event" runat="server" />
            <asp:HiddenField ID="HF_AgeGroup" runat="server" />
            <asp:HiddenField ID="HF_RndPkd" runat="server" /> <!-- selectedvalue of ddl_PkRnd -->
            <asp:HiddenField ID="HF_YearPkd" runat="server" /> <!-- Stores ddl_PkYear.selected value on home page.  Recent = 0 -->
            <asp:HiddenField ID="HF_TournName" runat="server" />
            <asp:HiddenField ID="HF_FormatCode" runat="server" />
            <asp:HiddenField ID="HF_SlalomRnds" runat="server" />
            <asp:HiddenField ID="HF_TrickRnds" runat="server" />
            <asp:HiddenField ID="HF_JumpRnds" runat="server" />
            <asp:HiddenField ID="HF_UseNOPS" runat="server" />
         <asp:HiddenField ID="HF_UseTeams" runat="server" />
         <asp:HiddenField ID="HF_DisplayMetric" runat="server" />
         </asp:Panel>
        <!-- Display title bar and error label -->
        <!-- Display title bar and error label -->
        <div>
            <div id="TName" runat="Server">
                <br /><asp:Label ID="lbl_Errors" runat="server" ForeColor="White"/>
            </div>
            <div ><center><asp:Button ID="Btn_Back" runat="server" Text="Back To Scores" /></center>
            </div>

        </div>
        <!-- Display 4 boxes - one for each event + Overall.  
            Put in skier's performances by round and pass as they become available -->
        
        <div style="display: flex; flex-direction: row; gap: 2rem; margin: 3rem; overflow-wrap: normal;">
            <div id="SlalomRecap" runat="server"></div> 
            <div id="TrickRecap" runat="server"></div>
            <div id="JumpRecap" runat="server"></div>
            <div id="OverallRecap" runat="server" class="box"></div>
       </div>
          
   </div>
    </form>
</body>
</html>
