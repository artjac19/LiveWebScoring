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
        
        /* Light blue background for table headers */
        .recap-container table thead,
        .recap-container table thead th,
        .recap-container table thead td {
            background-color: #d1ecf1 !important;
        }
        
        /* Force all tables to fit within containers */
        .recap-container table {
            width: 100% !important;
            table-layout: fixed !important;
            word-wrap: break-word !important;
        }
        
        .recap-container th,
        .recap-container td {
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
        }

        /* Trick Pass Table Column Widths */
        .trick-pass-table {
            width: 100%;
            table-layout: fixed !important;
        }

        .trick-pass-table th:nth-child(1),
        .trick-pass-table td:nth-child(1) {
            width: 20% !important;
            text-align: left;
        }

        .trick-pass-table th:nth-child(2),
        .trick-pass-table td:nth-child(2) {
            width: 25% !important;
            text-align: center;
        }

        .trick-pass-table th:nth-child(3),
        .trick-pass-table td:nth-child(3) {
            width: 35% !important;
            text-align: center;
        }

        .trick-pass-table th:nth-child(4),
        .trick-pass-table td:nth-child(4) {
            width: 20% !important;
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
        <!-- Blue header bar -->
        <div class="blue-bar">
            <a href="javascript:void(0)" onclick="window.location.href='default.aspx'" title="Go to Home" style="text-decoration: none;">
                <img src="images/skigirl.svg" alt="Skier Logo" class="logo" />
            </a>
            <div style="flex: 1; color: white; font-size: 1.2rem; font-weight: bold; display: flex; gap: 1rem; align-items: center; justify-content: center;">
                <span id="PerformanceRecapTitle" runat="Server">Performance Recap for [Skier Name] [Division]</span>
                <span style="font-size: 1rem; font-weight: normal;" id="TName" runat="Server"></span>
            </div>
            <asp:Button ID="Btn_Back" runat="server" Text="Back To Scores" OnClientClick="history.back(); return false;"
                style="background: transparent; color: white; border: 2px solid white; padding: 8px 16px; border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.backgroundColor='white'; this.style.color='#15274D';"
                onmouseout="this.style.backgroundColor='transparent'; this.style.color='white';" />
            <asp:Label ID="lbl_Errors" runat="server" ForeColor="White" style="margin-left: 10px;"/>
        </div>
        
        
        <!-- Display recap in two-column layout: left column has overall/slalom/jump, right column has trick -->
        <div class="recap-container" style="display: flex; flex-direction: row; gap: 2rem; margin: 1rem; overflow: hidden; width: calc(100vw - 3rem); box-sizing: border-box;">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem; overflow: hidden;">
                <div id="OverallRecap" runat="server"></div>
                <div id="SlalomRecap" runat="server"></div> 
                <div id="JumpRecap" runat="server"></div>
            </div>
            <div style="flex: 1; overflow: hidden;">
                <div id="TrickRecap" runat="server" style="overflow: hidden;"></div>
            </div>
       </div>
          
   </div>
    </form>
</body>
</html>
