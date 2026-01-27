Imports System.Web.Script.Serialization

''' <summary>
''' Mock data for local development without database connection.
''' Data format matches stored procedure output (PrLeaderBoard, PrSlalomScoresByRunOrder, etc.)
''' </summary>
Public Module MockData

    ' =====================================================================
    ' MASTER TOGGLE - Set to True for local dev without database
    ' WARNING: Must be False in production!
    ' =====================================================================
    Public Const USE_MOCK_DATA As Boolean = False

    ' Sample tournament for testing
    Private Const MOCK_SANCTION_ID As String = "25E001"
    Private Const MOCK_TOURN_NAME As String = "Mock Lake Classic"

    Public Function GetMockTournamentInfo() As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .tournamentName = MOCK_TOURN_NAME,
            .sanctionId = MOCK_SANCTION_ID,
            .formatCode = "LBSP",
            .availableEvents = New Object() {
                New With {.code = "S", .name = "Slalom", .rounds = 2},
                New With {.code = "T", .name = "Trick", .rounds = 2},
                New With {.code = "J", .name = "Jump", .rounds = 2},
                New With {.code = "O", .name = "Overall", .rounds = 2}
            },
            .availableDivisions = GetMockDivisionList(),
            .availableRounds = New Object() {},
            .onWaterData = GetMockOnWaterData()
        })
    End Function

    Public Function GetMockLeaderboard(eventCode As String, divisionCode As String) As String
        Dim htmlContent As String = BuildMockLeaderboardHtml(eventCode, divisionCode)
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .htmlContent = htmlContent,
            .onWaterData = GetMockOnWaterData(),
            .eventCode = eventCode,
            .divisionCode = divisionCode,
            .roundCode = "0",
            .placementFormat = "BEST",
            .availableDivisions = GetMockDivisionList()
        })
    End Function

    Public Function GetMockRunningOrder(eventCode As String, divisionCode As String) As String
        Dim htmlContent As String = BuildMockRunningOrderHtml(eventCode, divisionCode)
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .htmlContent = htmlContent,
            .onWaterData = GetMockOnWaterData(),
            .eventCode = eventCode,
            .divisionCode = divisionCode,
            .roundCode = "0",
            .displayType = "RUNNING_ORDER",
            .availableDivisions = GetMockDivisionList()
        })
    End Function

    Public Function GetMockDivisions(eventCode As String) As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .availableDivisions = GetMockDivisionList()
        })
    End Function

    Public Function GetMockRecentScores() As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .recentScores = New Object() {
                New With {.skierName = "Jane Smith", .event = "S", .score = "4 @ 35mph 38off", .division = "W1", .time = "2 min ago"},
                New With {.skierName = "John Doe", .event = "T", .score = "6250 POINTS (P1:3200 P2:3050)", .division = "M1", .time = "5 min ago"},
                New With {.skierName = "Mike Johnson", .event = "J", .score = "142FT (43.3M)", .division = "M2", .time = "8 min ago"}
            }
        })
    End Function

    ''' <summary>
    ''' Returns mock prioritized divisions for infinite scroll (GET_MOST_RECENT)
    ''' </summary>
    Public Function GetMockPrioritizedDivisions() As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .prioritizedDivisions = New Object() {
                New With {.event = "S", .division = "OM"},
                New With {.event = "S", .division = "OW"},
                New With {.event = "S", .division = "M1"},
                New With {.event = "S", .division = "W1"},
                New With {.event = "T", .division = "OM"},
                New With {.event = "T", .division = "OW"},
                New With {.event = "J", .division = "OM"},
                New With {.event = "J", .division = "OW"}
            }
        })
    End Function

    ''' <summary>
    ''' Returns all available divisions (LOAD_ALL_DIVISIONS)
    ''' </summary>
    Public Function GetMockAllDivisions() As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .availableDivisions = GetMockDivisionList()
        })
    End Function

    ''' <summary>
    ''' Returns mock by-division view data (GET_BY_DIVISION)
    ''' </summary>
    Public Function GetMockByDivision(eventCode As String, divisionCode As String) As String
        Dim htmlContent As String = ""

        ' Build content for each event if no specific event requested
        Dim events As New List(Of String)
        If String.IsNullOrEmpty(eventCode) OrElse eventCode = "0" Then
            events.AddRange({"S", "T", "J"})
        Else
            events.Add(eventCode)
        End If

        htmlContent = "<div class='by-division-content'>"
        For Each ev In events
            htmlContent += "<div style='display: flex; gap: 2rem; margin: 1rem 0; flex-wrap: wrap;'>"
            htmlContent += "<div style='flex: 1; min-width: 300px;'>"
            htmlContent += "<h5>Running Order</h5>"
            htmlContent += BuildMockRunningOrderHtml(ev, divisionCode)
            htmlContent += "</div>"
            htmlContent += "<div style='flex: 1; min-width: 300px;'>"
            htmlContent += "<h5>Leaderboard</h5>"
            htmlContent += BuildMockLeaderboardHtml(ev, divisionCode)
            htmlContent += "</div>"
            htmlContent += "</div>"
        Next
        htmlContent += "</div>"

        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .htmlContent = htmlContent,
            .onWaterData = GetMockOnWaterData(),
            .eventCode = eventCode,
            .divisionCode = divisionCode,
            .roundCode = "0",
            .displayType = "BY_DIVISION",
            .availableDivisions = GetMockDivisionList()
        })
    End Function

    ''' <summary>
    ''' Returns mock entry list HTML for TSkierListPro.aspx
    ''' </summary>
    Public Function GetMockEntryList() As String
        Dim sb As New System.Text.StringBuilder()

        sb.Append("<table class=""table table-striped"">")
        sb.Append("<thead><tr>")
        sb.Append("<th>Skier</th>")
        sb.Append("<th>Location</th>")
        sb.Append("<th>Division</th>")
        sb.Append("<th>Events</th>")
        sb.Append("</tr></thead>")
        sb.Append("<tbody>")

        ' Mock skier entries
        sb.Append(BuildMockEntryRow("Thompson, Alex", "Orlando, FL", "OM", "S T J"))
        sb.Append(BuildMockEntryRow("Rivera, Jordan", "Austin, TX", "OM", "S T"))
        sb.Append(BuildMockEntryRow("Williams, Casey", "San Diego, CA", "OM", "S J"))
        sb.Append(BuildMockEntryRow("Lee, Morgan", "Atlanta, GA", "M1", "S T J"))
        sb.Append(BuildMockEntryRow("Chen, Taylor", "Miami, FL", "OW", "S T J"))
        sb.Append(BuildMockEntryRow("Brooks, Riley", "Houston, TX", "OW", "T J"))
        sb.Append(BuildMockEntryRow("Davis, Quinn", "Phoenix, AZ", "W1", "S T"))
        sb.Append(BuildMockEntryRow("Martin, Avery", "Los Angeles, CA", "W1", "S T J"))
        sb.Append(BuildMockEntryRow("Parker, Drew", "Tampa, FL", "M1", "J"))
        sb.Append(BuildMockEntryRow("Reed, Skyler", "New Orleans, LA", "M2", "S T J"))
        sb.Append(BuildMockEntryRow("Foster, Blake", "Dallas, TX", "M2", "S J"))
        sb.Append(BuildMockEntryRow("Cole, Jamie", "Savannah, GA", "W2", "S T J"))

        sb.Append("</tbody></table>")
        Return sb.ToString()
    End Function

    Private Function BuildMockEntryRow(name As String, location As String, division As String, events As String) As String
        Dim sb As New System.Text.StringBuilder()
        sb.Append("<tr>")
        sb.Append("<td><strong>" & name & "</strong></td>")
        sb.Append("<td>" & location & "</td>")
        sb.Append("<td>" & division & "</td>")
        sb.Append("<td>" & events & "</td>")
        sb.Append("</tr>")
        Return sb.ToString()
    End Function

    ''' <summary>
    ''' Returns mock reports placeholder for TReports.aspx
    ''' </summary>
    Public Function GetMockReportList() As String
        Dim sb As New System.Text.StringBuilder()

        sb.Append("<div style=""text-align: center; padding: 2rem;"">")
        sb.Append("<h4>Reports</h4>")
        sb.Append("<p style=""color: #666; margin: 1rem 0;"">")
        sb.Append("<em>Mock Mode - No real report files available</em>")
        sb.Append("</p>")
        sb.Append("<p style=""color: #888; font-size: 0.9rem;"">")
        sb.Append("In production, this section would display links to:<br/>")
        sb.Append("• Slalom Results (PDF)<br/>")
        sb.Append("• Trick Results (PDF)<br/>")
        sb.Append("• Jump Results (PDF)<br/>")
        sb.Append("• Overall Results (PDF)<br/>")
        sb.Append("• Running Orders (PDF)")
        sb.Append("</p>")
        sb.Append("</div>")

        Return sb.ToString()
    End Function

    ''' <summary>
    ''' Returns mock tournament details JSON matching TDetails.aspx format
    ''' </summary>
    Public Function GetMockTournamentDetails() As String
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .Success = True,
            .activeEvent = "S",
            .officials = New Object() {
                New With {.role = "Chief Judge", .firstName = "John", .lastName = "Smith"},
                New With {.role = "Chief Scorer", .firstName = "Jane", .lastName = "Doe"},
                New With {.role = "Chief Driver", .firstName = "Mike", .lastName = "Johnson"},
                New With {.role = "Safety Director", .firstName = "Sarah", .lastName = "Williams"},
                New With {.role = "Technical Controller", .firstName = "Bob", .lastName = "Anderson"}
            },
            .tDetails = New Object() {
                New String() {"Tournament", MOCK_TOURN_NAME},
                New String() {"Sanction", MOCK_SANCTION_ID},
                New String() {"Dates", "January 15-17, 2025"},
                New String() {"Location", "Mock Lake, Orlando, FL"},
                New String() {"Class", "C - Record Capability"},
                New String() {"Events", "Slalom, Trick, Jump"},
                New String() {"Rounds", "2 per event"},
                New String() {"Site", "Mock Water Ski Club"}
            },
            .teams = New Object() {
                New With {.Name = "Florida Gators"},
                New With {.Name = "Texas Longhorns"},
                New With {.Name = "California Bears"},
                New With {.Name = "Georgia Bulldogs"}
            }
        })
    End Function

    ''' <summary>
    ''' Returns mock tournament list HTML matching GetTournamentList2 format exactly
    ''' </summary>
    Public Function GetMockTournamentList() As String
        Dim sb As New System.Text.StringBuilder()

        ' Matches exact HTML format from GetTournamentList2 in ModDataAccess3.vb line 1575-1613
        sb.Append("<table class=""table table-striped border-1"">")

        ' Mock tournaments - format: <tr><td>VIDEO</td><td><a href="..."><b>NAME</b></a><b> DATE SANCTIONID</b> LOCATION</td></tr>
        sb.Append(BuildMockTournamentRow("25E001", "Mock Lake Classic", "01/15/2025", "Orlando, FL"))
        sb.Append(BuildMockTournamentRow("25E002", "Sunshine State Open", "01/22/2025", "Tampa, FL"))
        sb.Append(BuildMockTournamentRow("25S001", "Texas Winter Warmup", "02/05/2025", "Austin, TX"))
        sb.Append(BuildMockTournamentRow("25M001", "Midwest Masters", "02/12/2025", "Chicago, IL"))
        sb.Append(BuildMockTournamentRow("25W001", "Pacific Coast Challenge", "02/19/2025", "San Diego, CA"))
        sb.Append(BuildMockTournamentRow("25C001", "Central Regional", "02/26/2025", "Denver, CO"))
        sb.Append(BuildMockTournamentRow("25E003", "Spring Fling", "03/05/2025", "Atlanta, GA"))
        sb.Append(BuildMockTournamentRow("25U001", "NCWSA Regional", "03/12/2025", "Gainesville, FL"))

        sb.Append("</table>")
        Return sb.ToString()
    End Function

    Private Function BuildMockTournamentRow(sanctionId As String, name As String, eventDate As String, location As String) As String
        ' Format must match GetTournamentList2 exactly - JS in tournament-list.js parses this structure
        ' It looks for: <a> with tournament name, second <b> with "date sanctionId", then location text
        Dim sb As New System.Text.StringBuilder()
        sb.Append("<tr>")
        sb.Append("<td></td>") ' Video column (empty for mock)
        sb.Append("<td><a href=""#""><b>" & name & "</b></a>")
        sb.Append("<b> " & eventDate & " " & sanctionId & "</b> " & location & "</td>")
        sb.Append("</tr>")
        Return sb.ToString()
    End Function

    Public Function GetMockBatchResults(events As List(Of String), divisions As List(Of String)) As String
        Dim results As New List(Of Object)
        For i As Integer = 0 To Math.Min(events.Count, divisions.Count) - 1
            results.Add(New With {
                .event = events(i),
                .division = divisions(i),
                .success = True,
                .htmlContent = BuildMockLeaderboardHtml(events(i), divisions(i)),
                .placementFormat = "BEST"
            })
        Next
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(New With {
            .success = True,
            .batchResults = results
        })
    End Function

    ' ========== Private Helpers ==========

    Private Function GetMockDivisionList() As Object()
        ' Matches format from LoadDvData: code, name, event
        Return New Object() {
            New With {.code = "OM", .name = "Open Men", .event = "S"},
            New With {.code = "OW", .name = "Open Women", .event = "S"},
            New With {.code = "M1", .name = "Men 1", .event = "S"},
            New With {.code = "W1", .name = "Women 1", .event = "S"},
            New With {.code = "M2", .name = "Men 2", .event = "S"},
            New With {.code = "W2", .name = "Women 2", .event = "S"},
            New With {.code = "BJ", .name = "Boys", .event = "S"},
            New With {.code = "GJ", .name = "Girls", .event = "S"},
            New With {.code = "OM", .name = "Open Men", .event = "T"},
            New With {.code = "OW", .name = "Open Women", .event = "T"},
            New With {.code = "M1", .name = "Men 1", .event = "T"},
            New With {.code = "W1", .name = "Women 1", .event = "T"},
            New With {.code = "OM", .name = "Open Men", .event = "J"},
            New With {.code = "OW", .name = "Open Women", .event = "J"},
            New With {.code = "M1", .name = "Men 1", .event = "J"},
            New With {.code = "W1", .name = "Women 1", .event = "J"}
        }
    End Function

    Private Function GetMockOnWaterData() As Object
        Return New With {
            .activeEvent = "S",
            .slalomOnWater = "",
            .trickOnWater = "",
            .jumpOnWater = ""
        }
    End Function

    Private Function BuildMockLeaderboardHtml(eventCode As String, divisionCode As String) As String
        Dim eventName As String = GetEventName(eventCode)
        Dim skiers = GetMockSkiers(eventCode, divisionCode)

        ' Matches HTML format from LeaderBoardBestRndLeftSP in ModDataAccess3.vb
        Dim sb As New System.Text.StringBuilder()
        sb.Append("<table class=""table table-striped division-section"" style=""margin-bottom: 1rem;"">")
        sb.Append("<tr class=""table-header-row""><td colspan=""3""><b>" & eventName.ToUpper() & " " & divisionCode & "</b></td></tr>")

        For Each skier In skiers
            sb.Append("<tr>")
            sb.Append("<td><a href=""TRecap.aspx?SID=" & MOCK_SANCTION_ID & "&MID=" & skier.MemberId & "&DV=" & divisionCode & "&EV=" & eventCode & """><strong>" & skier.SkierName & "</strong></a></td>")
            sb.Append("<td>" & skier.City & ", " & skier.State & "</td>")
            sb.Append("<td>" & skier.EventScoreDesc & "</td>")
            sb.Append("</tr>")
        Next

        sb.Append("</table>")
        Return sb.ToString()
    End Function

    Private Function BuildMockRunningOrderHtml(eventCode As String, divisionCode As String) As String
        Dim eventName As String = GetEventName(eventCode)
        Dim skiers = GetMockSkiers(eventCode, divisionCode)

        ' Matches HTML format from ScoresXRunOrdHoriz in ModDataAccess3.vb
        Dim sb As New System.Text.StringBuilder()
        sb.Append("<table>")
        sb.Append("<thead><tr>")
        sb.Append("<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">" & eventName.ToUpper() & "</th>")
        sb.Append("<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Group / Div</th>")
        sb.Append("<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Round 1</th>")
        sb.Append("<th style=""background-color: #15274D; color: white; font-size: 0.7rem;"">Round 2</th>")
        sb.Append("</tr></thead>")

        For Each skier In skiers
            sb.Append("<tr>")
            sb.Append("<td><a href=""TRecap.aspx?SID=" & MOCK_SANCTION_ID & "&MID=" & skier.MemberId & "&DV=" & divisionCode & "&EV=" & eventCode & """><b>" & skier.SkierName & "</b></a>")
            If skier.RankingScore <> "" Then
                sb.Append(" <small>(RS: " & skier.RankingScore & ")</small>")
            End If
            sb.Append("</td>")
            sb.Append("<td><b>" & divisionCode & "</b></td>")
            sb.Append("<td>" & skier.EventScoreDesc & "</td>")
            sb.Append("<td>" & skier.Round2Score & "</td>")
            sb.Append("</tr>")
        Next

        sb.Append("</table>")
        Return sb.ToString()
    End Function

    Private Function GetEventName(eventCode As String) As String
        Select Case eventCode
            Case "S" : Return "Slalom"
            Case "T" : Return "Trick"
            Case "J" : Return "Jump"
            Case "O" : Return "Overall"
            Case Else : Return "Event"
        End Select
    End Function

    Private Function GetMockSkiers(eventCode As String, divisionCode As String) As List(Of MockSkier)
        Dim skiers As New List(Of MockSkier)

        ' Data format matches PrLeaderBoard / PrSlalomScoresByRunOrder output
        Select Case eventCode
            Case "S"
                ' Slalom: EventScoreDesc = "FinalPassScore @ FinalSpeedMph mph FinalLenOff"
                skiers.Add(New MockSkier("Thompson, Alex", "123456789", "Orlando", "FL", "4 @ 36mph 38off", "2.5 @ 36mph 38off", "1250.00"))
                skiers.Add(New MockSkier("Rivera, Jordan", "234567890", "Austin", "TX", "2.5 @ 36mph 38off", "1 @ 36mph 38off", "1180.50"))
                skiers.Add(New MockSkier("Williams, Casey", "345678901", "San Diego", "CA", "1 @ 36mph 38off", "4 @ 34mph 35off", "1050.25"))
                skiers.Add(New MockSkier("Lee, Morgan", "456789012", "Atlanta", "GA", "3 @ 34mph 35off", "2 @ 34mph 35off", "980.00"))
            Case "T"
                ' Trick: EventScoreDesc = "Score POINTS (P1:ScorePass1 P2:ScorePass2)"
                skiers.Add(New MockSkier("Chen, Taylor", "567890123", "Miami", "FL", "7820 POINTS (P1:4120 P2:3700)", "7650 POINTS (P1:3900 P2:3750)", ""))
                skiers.Add(New MockSkier("Brooks, Riley", "678901234", "Houston", "TX", "6540 POINTS (P1:3400 P2:3140)", "6890 POINTS (P1:3500 P2:3390)", ""))
                skiers.Add(New MockSkier("Davis, Quinn", "789012345", "Phoenix", "AZ", "5920 POINTS (P1:3100 P2:2820)", "6100 POINTS (P1:3200 P2:2900)", ""))
                skiers.Add(New MockSkier("Martin, Avery", "890123456", "Los Angeles", "CA", "5450 POINTS (P1:2800 P2:2650)", "5200 POINTS (P1:2700 P2:2500)", ""))
            Case "J"
                ' Jump: EventScoreDesc = "ScoreFeet FT (ScoreMeters M)"
                skiers.Add(New MockSkier("Parker, Drew", "901234567", "Tampa", "FL", "178FT (54.3M)", "172FT (52.4M)", ""))
                skiers.Add(New MockSkier("Reed, Skyler", "012345678", "New Orleans", "LA", "165FT (50.3M)", "168FT (51.2M)", ""))
                skiers.Add(New MockSkier("Foster, Blake", "112233445", "Dallas", "TX", "152FT (46.3M)", "158FT (48.2M)", ""))
                skiers.Add(New MockSkier("Cole, Jamie", "223344556", "Savannah", "GA", "145FT (44.2M)", "149FT (45.4M)", ""))
            Case "O"
                ' Overall: Points total
                skiers.Add(New MockSkier("Thompson, Alex", "123456789", "Orlando", "FL", "2847.50 pts", "", ""))
                skiers.Add(New MockSkier("Chen, Taylor", "567890123", "Miami", "FL", "2654.20 pts", "", ""))
                skiers.Add(New MockSkier("Parker, Drew", "901234567", "Tampa", "FL", "2598.80 pts", "", ""))
                skiers.Add(New MockSkier("Rivera, Jordan", "234567890", "Austin", "TX", "2445.10 pts", "", ""))
            Case Else
                skiers.Add(New MockSkier("Test, Skier", "999999999", "Test City", "TS", "Score 1", "Score 2", ""))
        End Select

        Return skiers
    End Function

    ' Matches columns from PrLeaderBoard / PrSlalomScoresByRunOrder stored procedures
    Private Class MockSkier
        Public Property SkierName As String      ' From TourReg.SkierName
        Public Property MemberId As String       ' From TourReg.MemberId
        Public Property City As String           ' From TourReg.City
        Public Property State As String          ' From TourReg.State
        Public Property EventScoreDesc As String ' Computed field from stored proc
        Public Property Round2Score As String    ' For running order display
        Public Property RankingScore As String   ' From EventReg.RankingScore

        Public Sub New(name As String, memberId As String, city As String, state As String, score As String, r2Score As String, ranking As String)
            SkierName = name
            Me.MemberId = memberId
            Me.City = city
            Me.State = state
            EventScoreDesc = score
            Round2Score = r2Score
            RankingScore = ranking
        End Sub
    End Class

End Module
