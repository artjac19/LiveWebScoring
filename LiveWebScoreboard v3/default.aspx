<%@ Page Language="vb" AutoEventWireup="false" CodeBehind="default.aspx.vb" Inherits="LiveWebScoreBoard._default" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">

<head runat="server">
    <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Live Web Scorebook Home Page</title>
    <link rel="stylesheet" href="Content/bootstrap.min.css" />
    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" />
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="Scripts/default.js"></script>
    <link rel="stylesheet" href="Content/styles.css" />
</head>

<body>
    <form id="form1" runat="server">
        <!-- Blue Navbar -->
        <div class="blue-bar">
            <a href="javascript:void(0)" onclick="window.location.href=window.location.href"
                title="Refresh page" style="text-decoration: none;">
                <img src="images/skigirl.svg" alt="LiveWeb Ski Girl Logo" class="logo" />
            </a>
            <asp:TextBox ID="TB_SanctionID" runat="server" CssClass="search-input"
                placeholder="Sanction #, Name, or Location"/>
            <asp:Button ID="Btn_SanctionID" runat="server"
                CssClass="search-btn-svg" Text="" ToolTip="Search"
                aria-label="Search" OnClick="Btn_SanctionID_ServerClick" />
            <div class="resources-container">
                <button class="resources-btn" type="button" id="dropdownResources" aria-expanded="false">
                    <span class="resources-text">WSTIMS Resources</span><span class="hamburger-icon">&#9776;</span>
                </button>
                <ul class="resources-menu" aria-labelledby="dropdownResources">
                    <li><a class="resources-item" href="/AppRepo/WaterskiScoringSystem/publish.htm" target="_blank">
                        <i class="resources-icon bi bi-download"></i>WSTIMS For Windows Download
                    </a></li>
                    <li><a class="resources-item" href="/AppRepo/WscMessageHandler/publish.htm" target="_blank">
                        <i class="resources-icon bi bi-chat-dots"></i>WaterSkiConnect Message Handler
                    </a></li>
                    <li><a class="resources-item" href="/AppRepo/waterski.sdf" download="waterski.sdf">
                        <i class="resources-icon bi bi-hdd-rack"></i>WSTIMS Database Download
                    </a></li>
                    <li><a class="resources-item" href="https://teamusa-org-migration.s3.amazonaws.com/USA%20Water%20Ski%20&amp;%20Wake%20Sports/Migration/Documents/AWSAScoringTutorial.pdf" target="_blank">
                        <i class="resources-icon bi bi-file-earmark-text"></i>Scoring Tutorial
                    </a></li>
                    <li><a class="resources-item" href="/Newsletters/" target="_blank">
                        <i class="resources-icon bi bi-archive"></i>Newsletter Archive
                    </a></li>
                    <li><a class="resources-item" href="/Newsletters/Volume23/How To Do It 2-24-23.pdf" target="_blank">
                        <i class="resources-icon bi bi-journal-text"></i>How to Index
                    </a></li>
                    <li><a class="resources-item" href="/ReleaseDocuments/" target="_blank">
                        <i class="resources-icon bi bi-folder2-open"></i>Release Documents
                    </a></li>
                    <li><a class="resources-item" href="https://waterskiresults.vids.io/" target="_blank">
                        <i class="resources-icon bi bi-camera-video"></i>Trick Video Site
                    </a></li>
                </ul>
            </div>
        </div>
        <div class="tournament-display">
        <!-- Filter Bubbles Section -->
            <div class="vert-container">
                <div class="filter-containers-wrapper">
                    <!-- Year Filter Container -->
                    <div class="filter-container">
                        <asp:Button ID="Btn_Recent20" runat="server" Text="Most Recent 20"
                            CssClass="filter-btn active" OnClick="ApplyFilter_Click" CommandArgument="0" />
                        <asp:Button ID="Btn_Year2025" runat="server" Text="Ski Year 2025" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="25" />
                        <asp:Button ID="Btn_Year2024" runat="server" Text="Ski Year 2024" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="24" />
                        <asp:Button ID="Btn_Year2023" runat="server" Text="Ski Year 2023" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="23" />
                        <asp:Button ID="Btn_Year2022" runat="server" Text="Ski Year 2022" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="22" />
                        <asp:Button ID="Btn_Year2021" runat="server" Text="Ski Year 2021" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="21" />
                    </div>

                    <!-- Region Filter Container -->
                    <div class="filter-container">
                        <asp:Button ID="Btn_RegionEast" runat="server" Text="East" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="E" />
                        <asp:Button ID="Btn_RegionSouth" runat="server" Text="South" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="S" />
                        <asp:Button ID="Btn_RegionMidwest" runat="server" Text="Midwest" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="M" />
                        <asp:Button ID="Btn_RegionCentral" runat="server" Text="Central" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="C" />
                        <asp:Button ID="Btn_RegionWest" runat="server" Text="West" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="W" />
                        <asp:Button ID="Btn_RegionNone" runat="server" Text="None" CssClass="filter-btn"
                            OnClick="ApplyFilter_Click" CommandArgument="" />
                    </div>
                </div>
                <div class="tournament-list-container">
                    <asp:Label ID="lbl_Errors" runat="server" ForeColor="Red" Font-Bold="true"></asp:Label>
                    <asp:Label ID="Lbl_TournamentErrors" runat="server" ForeColor="Red" Font-Bold="true"
                        CssClass="mb-2"></asp:Label>
                    <div id="noResultsMessage" class="no-results-message">
                        No results found.
                    </div>
                    <!-- Desktop view-->
                    <div class="desktop-tournament-container">
                        <div id="TList" runat="server" class="desktop-table-view"/>
                    </div>

                    <!-- Mobile view -->
                    <div id="MobileTList" class="mobile-table-view"></div>

                
                </div>
            </div>
            <!-- Tournament details panel for desktop -->
            <div id="tournamentInfoPanel" class="tournament-info-panel">
            </div>
        </div>
        <!--
                        <div class="p-1 mr-4 bg-light rounded-3">
                            <h4>Welcome,</h4>
                            The WSTIMS scoring program enables scorers to post UNOFFICIAL results, as they happen.
                            Trick video is available if the <img src="images/Flag-green16.png" /> icon is displayed in
                            the tournament list.
                            For Official results click the Reports button on the Tournament Home Page.

                            <h4>Directions</h4>
                            <ol>
                                <li>Select a range of tournaments and pick from the list<br />or enter a sanction number
                                </li>
                                <li>On the Tournament Home Page select a Display Style<br />
                                    If the tournament is in progress the event(s) currently being scored are
                                    listed<br />
                                    <b>WARNING TO SKIERS:</b> DO NOT rely on the running orders displayed for your start
                                    times, especially if multiple lakes are in use.
                                </li>
                                <li>On the selected page, Select an Event<br />optional - select Division, Group or
                                    Round</li>
                                <li>Click on a skier's name to display recap results for all events entered.</li>
                                <li>Click the Update button to refresh the data</li>
                            </ol>
                        </div>
                        -->
            <div class="row" style="margin: 200px 0 100px 0; align-self: center;">
                <div style="text-align: center;">
                    Live Web Scoreboard is a free volunteer created resource intended to advance the sport of
                    waterskiing.
                    <br />&copy; 2024 All rights reserved
                    <br />
                        No Yada Yada<br />
                        <b>Privacy Policy</b><br />
                        This site does not collect or store any information from site users.
                        Information displayed is in the public domain and freely available elsewhere, albeit not quite
                        as conveniently.<br />

                        <b>Terms of Use</b><br />
                        Enjoy the content. Do not make any modifications. You may place a link to
                        scores.waterskiresults.com on your website.
                        Republication by any other means is prohibited without written consent.
                </div>

            </div>
    </form>
</body>

</html>
