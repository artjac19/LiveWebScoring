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
        /* Make everything much smaller on recap page */
        .recap-container {
            font-size: 0.65em !important;
        }
        
        /* Make sure all elements inherit the smaller font */
        .recap-container * {
            font-size: inherit !important;
        }
        
        /* Light blue background for table headers */
        .recap-container table thead,
        .recap-container table thead th,
        .recap-container table thead td {
            background-color: #d1ecf1 !important;
        }
        
        /* Trick Pass Table Column Widths */
        .trick-pass-table {
            width: 100%;
            table-layout: auto;
        }

        .trick-pass-table th:nth-child(1),
        .trick-pass-table td:nth-child(1) {
            width: 10%;
            white-space: nowrap;
            text-align: center;
        }

        .trick-pass-table th:nth-child(2),
        .trick-pass-table td:nth-child(2) {
            width: 25%;
            white-space: nowrap;
            text-align: center;
        }

        .trick-pass-table th:nth-child(3),
        .trick-pass-table td:nth-child(3) {
            width: 50%;
            word-wrap: break-word;
            white-space: normal;
        }

        .trick-pass-table th:nth-child(4),
        .trick-pass-table td:nth-child(4) {
            width: 15%;
            white-space: nowrap;
            text-align: center;
        }
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
        <!-- Consolidated title for all recaps -->
        <div style="text-align: center; margin: 2rem 0;">
            <h2 id="ConsolidatedTitle" runat="server">Skier Performance Recap</h2>
        </div>
        
        <!-- Display 4 boxes - one for each event + Overall with smaller font -->
        <div class="recap-container" style="display: flex; flex-direction: row; gap: 1rem; margin: 1rem; overflow-wrap: normal;">
            <div id="SlalomRecap" runat="server"></div> 
            <div id="TrickRecap" runat="server"></div>
            <div id="JumpRecap" runat="server"></div>
            <div id="OverallRecap" runat="server" class="box"></div>
       </div>
          
   </div>
    </form>
</body>
</html>
