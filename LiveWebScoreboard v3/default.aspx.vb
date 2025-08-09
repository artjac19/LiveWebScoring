Imports System.Web.UI.HtmlControls
Imports System.Web.UI.WebControls
Imports System.Text.RegularExpressions

Public Class _default
    Inherits System.Web.UI.Page

    Protected WithEvents Btn_SanctionID As Global.System.Web.UI.WebControls.Button

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            Dim sCurMM As Int16 = CInt(Month(Now))

            Dim sSkiYr As String
            If Request("YR") IsNot Nothing Then
                sSkiYr = Trim(Request("YR"))

                SetActiveFilterButton(sSkiYr)
            Else
                sSkiYr = "0" ' Code for Most Recent 20
                Btn_Recent20.CssClass = "filter-btn active"
            End If

            LoadTournamentList(sSkiYr)

            If Request("EM") IsNot Nothing Then
                lbl_Errors.Text = Request("EM")
            End If

            ' Handle search parameter from URL
            If Request("search") IsNot Nothing Then
                Dim searchInput As String = Trim(Request("search"))
                TB_SanctionID.Text = searchInput

                ' Perform the same search logic as Btn_SanctionID_ServerClick
                If Regex.IsMatch(searchInput, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
                    Response.Redirect("Tournament.aspx?SN=" & searchInput & "&FM=1&SY=0")
                    Exit Sub
                Else
                    Dim sResultsHtml As String = ModDataAccess3.SearchTournamentsByKeyword(searchInput)
                    If sResultsHtml.Contains("No tournaments found") Then
                        Lbl_TournamentErrors.Text = "No tournaments found matching your search."
                        TList.InnerHtml = ""
                    Else
                        TList.InnerHtml = sResultsHtml
                        Lbl_TournamentErrors.Text = ""
                        ResetFilterButtons()
                        ResetRegionButtons()
                    End If
                End If
            End If
        End If
    End Sub

    Protected Sub ApplyFilter_Click(sender As Object, e As EventArgs)
        Dim clickedButton As Button = DirectCast(sender, Button)
        Dim sSkiYr As String = If(Request("YR") IsNot Nothing, Trim(Request("YR")), "0")
        Dim region As String = If(Request("RG") IsNot Nothing, Trim(Request("RG")), "")

        If clickedButton.ID.Contains("Region") Then
            region = clickedButton.CommandArgument
        Else
            sSkiYr = clickedButton.CommandArgument
        End If

        Response.Redirect("default.aspx?YR=" & sSkiYr & "&RG=" & region)
    End Sub

    Private Sub LoadTournamentList(sSkiYr As String)
        Dim region As String = ""

        If Request("RG") IsNot Nothing Then
            region = Trim(Request("RG"))
            SetActiveRegionButton(region)
        End If

        Dim sMsg As String = ModDataAccess3.GetTournamentList2(sSkiYr, region)

        If sMsg.Contains("Error") Then
            lbl_Errors.Text = sMsg
            Exit Sub
        End If

        TList.InnerHtml = sMsg
    End Sub

    Private Sub ResetFilterButtons()
        Btn_Recent20.CssClass = "filter-btn"
        Btn_Year2021.CssClass = "filter-btn"
        Btn_Year2022.CssClass = "filter-btn"
        Btn_Year2023.CssClass = "filter-btn"
        Btn_Year2024.CssClass = "filter-btn"
        Btn_Year2025.CssClass = "filter-btn"
    End Sub

    Private Sub ResetRegionButtons()
        Btn_RegionEast.CssClass = "filter-btn"
        Btn_RegionSouth.CssClass = "filter-btn"
        Btn_RegionMidwest.CssClass = "filter-btn"
        Btn_RegionCentral.CssClass = "filter-btn"
        Btn_RegionWest.CssClass = "filter-btn"
    End Sub

    Private Sub SetActiveFilterButton(sSkiYr As String)
        ResetFilterButtons()

        Select Case sSkiYr
            Case "0"
                Btn_Recent20.CssClass = "filter-btn active"
            Case "21"
                Btn_Year2021.CssClass = "filter-btn active"
            Case "22"
                Btn_Year2022.CssClass = "filter-btn active"
            Case "23"
                Btn_Year2023.CssClass = "filter-btn active"
            Case "24"
                Btn_Year2024.CssClass = "filter-btn active"
            Case "25"
                Btn_Year2025.CssClass = "filter-btn active"
        End Select
    End Sub

    Private Sub SetActiveRegionButton(region As String)
        ResetRegionButtons()

        Select Case UCase(region)
            Case "E"
                Btn_RegionEast.CssClass = "filter-btn active"
            Case "S"
                Btn_RegionSouth.CssClass = "filter-btn active"
            Case "M"
                Btn_RegionMidwest.CssClass = "filter-btn active"
            Case "C"
                Btn_RegionCentral.CssClass = "filter-btn active"
            Case "W"
                Btn_RegionWest.CssClass = "filter-btn active"
        End Select
    End Sub

    Protected Sub Btn_Home_Click(sender As Object, e As EventArgs)
        Response.Redirect("default.aspx")
    End Sub

    Protected Sub Btn_SanctionID_ServerClick(sender As Object, e As EventArgs)
        Dim sInput As String = TB_SanctionID.Text.Trim()
        If Regex.IsMatch(sInput, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
            ' Test our new function when a valid sanction ID is entered
            Dim recentDivs = ModDataAccess3.GetDvMostRecent(sInput, "S")

            ' Sanction number - redirect as before
            Response.Redirect("Tournament.aspx?SN=" & sInput & "&FM=1&SY=0")
            Exit Sub
        End If

        ' Otherwise treat as keyword search
        Dim sResultsHtml As String = ModDataAccess3.SearchTournamentsByKeyword(sInput)
        If sResultsHtml.Contains("No tournaments found") Then
            Lbl_TournamentErrors.Text = "No tournaments found matching your search."
            TList.InnerHtml = ""
            Exit Sub
        End If

        TList.InnerHtml = sResultsHtml
        Lbl_TournamentErrors.Text = ""

        ' Reset filter buttons when search results are loaded
        ResetFilterButtons()
        ResetRegionButtons()

        ' Redirect to avoid POST resubmission popup on refresh
        Response.Redirect("default.aspx?search=" & Server.UrlEncode(sInput))
    End Sub
End Class