<%@ Page Language="vb" AutoEventWireup="false" CodeBehind="TSkierListPro.aspx.vb" Inherits="LiveWebScoreBoard.TSkierListPro" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
  <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Entry List</title>
    <link rel="stylesheet" href="Content/bootstrap.min.css" />
    <link rel="stylesheet" href="Content/styles.css" />
    <style>
        /* TRecap-style navbar overrides */
        .blue-bar {
            background: #15274D;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
            min-height: fit-content;
            height: auto;
        }

        .logo {
            height: 40px;
            width: 40px;
            margin-right: 15px;
        }

        .logo:hover {
            transform: scale(1.05);
            transition: transform 0.2s;
        }

        /* Center the entry list table */
        #InsertHere {
            text-align: center;
        }

        /* Mobile responsive styling */
        @media (max-width: 1000px) {
            .navbar-title {
                font-size: 0.9rem !important;
            }
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
   <!-- Store user selections -->
        <asp:HiddenField ID="HF_SanctionID" runat="server" />
        <asp:HiddenField ID="HF_SkierID" runat="server" />
        <asp:HiddenField ID="HF_Event" runat="server" />
        <asp:HiddenField ID="HF_AgeGroup" runat="server" />
        <asp:HiddenField ID="HF_YearPkd" runat="server" /> <!-- Stores ddl_PkYear.selected value on home page.  Recent = 0 -->
        <asp:HiddenField ID="HF_TournName" runat="server" />
        <!-- Blue header bar -->
        <div class="blue-bar">
            <a href="javascript:void(0)" onclick="window.location.href='default.aspx'" title="Go to Home" style="text-decoration: none;">
                <img src="images/skigirl.svg" alt="Skier Logo" class="logo" />
            </a>
            <div class="navbar-title" style="flex: 1; color: white; font-size: 1.2rem; font-weight: bold; display: flex; gap: 1rem; align-items: center; justify-content: center;">
                <span>Entry List</span>
                <span style="font-size: 1rem; font-weight: normal;" id="TName" runat="Server"></span>
            </div>
            <asp:Button ID="Btn_Back" runat="server" Text="Back To Scores" OnClientClick="history.back(); return false;"
                style="background: transparent; color: white; border: 2px solid white; padding: 8px 16px; border-radius: 5px; font-weight: bold; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.backgroundColor='white'; this.style.color='#15274D';"
                onmouseout="this.style.backgroundColor='transparent'; this.style.color='white';" />
            <asp:Label ID="lbl_Errors" runat="server" ForeColor="White" style="margin-left: 10px;"/>
        </div>
        <!-- Display One column.   -->
         <div id="InsertHere" runat="server">

         </div>
               
    </form>
</body>
</html>
